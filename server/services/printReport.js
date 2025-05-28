// utils/printReport.js
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
const Printer = require("../models/printer");
const Company = require("../models/company");
const Store = require("../models/store");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const defaultPrinter = async () => {
    const printer = await Printer.findOne({ isDefault: true });
    if (!printer) {
        throw new Error("Aucune imprimante par défaut trouvée.");
    }
    return printer;
};

const initPrinter = async (printerConfig) => {
    const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface:
            printerConfig.type === "usb"
                ? "usb"
                : `tcp://${printerConfig.ip}:${printerConfig.port || 9100}`,
        options: {
            timeout: 5000,
        },
        width: 48,
        characterSet: "SLOVENIA",
        removeSpecialCharacters: false,
        lineCharacter: "-",
    });

    return printer;
};

function printJustified(printer, label, value, lineLength = 42) {
    const labelText = label.toUpperCase();
    const valueText = value.toLocaleString();
    const spaceLength = Math.max(1, lineLength - labelText.length - valueText.length);
    const spaces = ' '.repeat(spaceLength);
    printer.println(`${labelText}${spaces}${valueText}`);
}

function padRight(str, length) {
    return str.length >= length ? str.slice(0, length) : str + ' '.repeat(length - str.length);
}

function padLeft(str, length) {
    str = str.toString();
    return str.length >= length ? str.slice(0, length) : ' '.repeat(length - str.length) + str;
}

const printReport = async ({
    date,
    cashierName,
    paymentSummary,
    salesByStore,
    salesByAttendant,
    discounts,
    cancellations,
    expenses,
    signedBills,
    status,
    totalDifference,
    totalSales,
    totalCollections,
}) => {
    let printerConfig;
    try {
        printerConfig = await defaultPrinter();
    } catch (error) {
        console.warn("Default printer not found, trying Bar Printer...");
        printerConfig = await Printer.findOne({ name: "Bar Printer" });
        if (!printerConfig) {
            throw new Error("Aucune imprimante par défaut ni Bar Printer trouvée.");
        }
    }

    const printer = await initPrinter(printerConfig);
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
        throw new Error("Bar Printer également non connectée.");
    }

    const company = await Company.findOne();
    if (!company) {
        console.error("Aucune information sur l'entreprise trouvée.");
        return false;
    }

    // Affichage du logo
    if (company.logo) {
        const logoPath = path.join(__dirname, "../images/", path.basename(company.logo));
        if (fs.existsSync(logoPath)) {
            const resizedLogoPath = path.join(__dirname, "../images/resized-logo.png");
            await sharp(logoPath)
                .resize({ width: 300 })
                .toFormat("png")
                .toFile(resizedLogoPath);

            printer.alignCenter();
            await printer.printImage(resizedLogoPath);
            printer.newLine();
        } else {
            console.error("Logo introuvable à cet emplacement:", logoPath);
        }
    } else {
        console.warn("Aucun logo défini pour l'entreprise.");
    }

    printer.alignCenter();
    printer.bold(true);
    printer.println(company.name);
    printer.println(company.email);
    printer.drawLine();

    printer.alignLeft();
    printer.println("=== RAPPORT JOURNALIER ===");
    printer.println(`Date: ${new Date(date).toLocaleDateString()}`);
    printer.println(`Caissier: ${cashierName}`);
    printer.drawLine();

    printer.alignLeft();
    printer.println("RAPPORT DE CAISSE");
    printer.drawLine();
    printer.bold(false);

    paymentSummary.forEach(({ method, total }) => {
        printJustified(printer, method, total);
    });
    printJustified(printer, "FACTURE SIGNEE", signedBills);
    printJustified(printer, "RÉDUCTIONS", discounts);
    printJustified(printer, "ANNULATIONS", cancellations);
    printJustified(printer, "DÉPENSES", expenses);
    printer.drawLine();

    printer.alignLeft();
    printer.println("STATUT DE CAISSE");
    printer.drawLine();

    printJustified(printer, "ÉTAT", status);
    printJustified(printer, "DIFFÉRENCE", totalDifference);
    printJustified(printer, "TOTAL VENTES", totalSales);
    printJustified(printer, "ENCAISSÉ", totalCollections);
    printer.drawLine();

    printer.alignLeft();
    printer.println("VENTES PAR SERVEUR");
    printer.drawLine();

    salesByAttendant.forEach(({ attendant, total }) => {
        printJustified(printer, attendant, total);
    });

    printer.drawLine();


    printer.alignLeft();
    printer.println("VENTES PAR MAGASIN");
    printer.drawLine();
    // 🔄 Récupération des noms de magasins
    const storeIds = salesByStore.map(s => s._id);
    const stores = await Store.find({ _id: { $in: storeIds } }).select("name");
    const storeNameMap = Object.fromEntries(stores.map(s => [s._id.toString(), s.name]));

    salesByStore.forEach(store => {
        const storeName = storeNameMap[store._id.toString()] || `ID: ${store._id}`;
        printer.println(`Magasin : ${storeName}`);
        printer.println("==========================");
        printer.println("Article                  Qté              Total");
        printer.drawLine();

        store.items.forEach(item => {
            const name = padRight(item.name, 20);
            const qty = padLeft(item.quantity, 5);
            const total = padLeft(item.total.toLocaleString());
            printer.println(`${name}   ${qty}           ${total}`);
        });

        printer.drawLine();
        const storeTotal = padLeft(store.storeTotal.toLocaleString());
        printer.println(padLeft("Total Magasin:", 25) + storeTotal);
        printer.drawLine();
    });

    printer.alignCenter();
    printer.println("=== END OF REPORT ===");
    printer.cut();

    try {
        const success = await printer.execute();
        if (!success) throw new Error("Failed to print");
    } catch (error) {
        console.error("Printer Error:", error.message);
    }
};

module.exports = printReport;
