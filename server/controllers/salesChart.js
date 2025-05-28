const mongoose = require("mongoose");
const Sale = require("../models/sales");
const HttpError = require("../models/error");
const Item = require("../models/item");
const User = require("../models/user");

// Map payment methods to chart keys
const paymentMethodToChartKey = {
    cash: "desktop",
    card: "mobile",
    // Add more mappings if needed
};

const getSalesChartData = async (req, res, next) => {
    try {
        const { range = "30d", groupBy = "paymentMethod" } = req.query;
        let days = 30;
        let useDateFilter = true;
        if (range === "all") {
            useDateFilter = false;
        } else if (range === "90d") days = 90;
        else if (range === "7d") days = 7;

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);

        let chartData = [];
        let matchStage = {};
        if (useDateFilter) {
            matchStage.createdAt = { $gte: startDate, $lte: endDate };
        }
        if (groupBy === "attendant") {
            chartData = await Sale.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            attendant: "$attendant"
                        },
                        total: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { "_id.date": 1 } }
            ]);
            const attendantIds = [...new Set(chartData.map(d => d._id.attendant).filter(Boolean))];
            const attendants = await User.find({ _id: { $in: attendantIds } }).select("_id name");
            const attendantMap = Object.fromEntries(attendants.map(a => [a._id.toString(), a.name]));
            const chartDataMap = {};
            let allDates = [];
            if (useDateFilter) {
                for (let i = 0; i < days; i++) {
                    const d = new Date(startDate);
                    d.setDate(startDate.getDate() + i);
                    allDates.push(d.toISOString().slice(0, 10));
                }
            } else {
                allDates = [...new Set(chartData.map(s => s._id.date))];
            }
            allDates.forEach(dateStr => {
                chartDataMap[dateStr] = { date: dateStr };
                attendantIds.forEach(id => {
                    chartDataMap[dateStr][attendantMap[id] || id] = 0;
                });
            });
            chartData.forEach(s => {
                const { date, attendant } = s._id;
                const name = attendantMap[attendant?.toString()] || "Unknown";
                if (chartDataMap[date]) {
                    chartDataMap[date][name] = s.total;
                }
            });
            chartData = Object.values(chartDataMap);
        } else if (groupBy === "item") {
            chartData = await Sale.aggregate([
                { $match: matchStage },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            item: "$items.item"
                        },
                        quantity: { $sum: "$items.quantity" },
                        total: { $sum: "$items.total" }
                    }
                },
                { $sort: { "_id.date": 1 } }
            ]);
            const itemIds = [...new Set(chartData.map(d => d._id.item).filter(Boolean))];
            const items = await Item.find({ _id: { $in: itemIds } }).select("_id name");
            const itemMap = Object.fromEntries(items.map(i => [i._id.toString(), i.name]));
            const chartDataMap = {};
            let allDates = [];
            if (useDateFilter) {
                for (let i = 0; i < days; i++) {
                    const d = new Date(startDate);
                    d.setDate(startDate.getDate() + i);
                    allDates.push(d.toISOString().slice(0, 10));
                }
            } else {
                allDates = [...new Set(chartData.map(s => s._id.date))];
            }
            allDates.forEach(dateStr => {
                chartDataMap[dateStr] = { date: dateStr };
                itemIds.forEach(id => {
                    chartDataMap[dateStr][itemMap[id] || id] = 0;
                });
            });
            chartData.forEach(s => {
                const { date, item } = s._id;
                const name = itemMap[item?.toString()] || "Unknown";
                if (chartDataMap[date]) {
                    chartDataMap[date][name] = s.quantity;
                }
            });
            chartData = Object.values(chartDataMap);
        } else {
            const sales = await Sale.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            paymentMethod: "$paymentMethod"
                        },
                        total: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { "_id.date": 1 } }
            ]);
            const chartDataMap = {};
            let allDates = [];
            if (useDateFilter) {
                for (let i = 0; i < days; i++) {
                    const d = new Date(startDate);
                    d.setDate(startDate.getDate() + i);
                    allDates.push(d.toISOString().slice(0, 10));
                }
            } else {
                allDates = [...new Set(sales.map(s => s._id.date))];
            }
            allDates.forEach(dateStr => {
                chartDataMap[dateStr] = { date: dateStr, desktop: 0, mobile: 0 };
            });
            sales.forEach((s) => {
                const { date, paymentMethod } = s._id;
                const chartKey = paymentMethodToChartKey[paymentMethod];
                if (chartKey && chartDataMap[date]) {
                    chartDataMap[date][chartKey] = s.total;
                }
            });
            chartData = Object.values(chartDataMap);
        }
        res.status(200).json({ chartData });
    } catch (error) {
        console.error("Erreur lors de la récupération des données du graphique des ventes:", error);
        next(new HttpError("Erreur serveur lors de la récupération des données du graphique des ventes.", 500));
    }
};

// Get sales by attendant (all time)
const getSalesByAttendant = async (req, res, next) => {
    try {
        const chartData = await Sale.aggregate([
            {
                $group: {
                    _id: "$attendant",
                    total: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
        ]);
        const attendantIds = chartData.map(d => d._id).filter(Boolean);
        const attendants = await User.find({ _id: { $in: attendantIds } }).select("_id name");
        const attendantMap = Object.fromEntries(attendants.map(a => [a._id.toString(), a.name]));
        const result = chartData.map(d => ({
            attendant: attendantMap[d._id?.toString()] || "Unknown",
            total: d.total,
            count: d.count
        }));
        res.status(200).json({ chartData: result });
    } catch (error) {
        console.error("Erreur lors de la récupération des ventes par attendant:", error);
        next(new HttpError("Erreur serveur lors de la récupération des ventes par attendant.", 500));
    }
};

// Get sales by item (all time)
const getSalesByItem = async (req, res, next) => {
    try {
        const chartData = await Sale.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.item",
                    quantity: { $sum: "$items.quantity" },
                    total: { $sum: "$items.total" }
                }
            },
        ]);
        const itemIds = chartData.map(d => d._id).filter(Boolean);
        const items = await Item.find({ _id: { $in: itemIds } }).select("_id name");
        const itemMap = Object.fromEntries(items.map(i => [i._id.toString(), i.name]));
        const result = chartData.map(d => ({
            item: itemMap[d._id?.toString()] || "Unknown",
            quantity: d.quantity,
            total: d.total
        }));
        res.status(200).json({ chartData: result });
    } catch (error) {
        console.error("Erreur lors de la récupération des ventes par item:", error);
        next(new HttpError("Erreur serveur lors de la récupération des ventes par item.", 500));
    }
};

module.exports = { getSalesChartData, getSalesByAttendant, getSalesByItem };
