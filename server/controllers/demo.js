require("dotenv").config();
const User = require("../models/user");
const Company = require("../models/company");
const bcrypt = require("bcryptjs");
const path = require("path");
const HttpError = require("../models/error")

const createAdminAndCompany = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (token !== process.env.DEMO_SECRET) {
            return next(new HttpError("Non autorisé : jeton invalide, veuillez contacter l'administrateur.", 401))
        }

        const existingAdmin = await User.findOne({ username: "gbalekage" });
        const existingCompany = await Company.findOne({ name: "MYPOS" });

        if (existingAdmin && existingCompany) {
            return next(new HttpError("Démo déjà initialisée.", 200))
        }

        const password = await bcrypt.hash("admin2416", 10);

        const adminUser = new User({
            name: "My POS",
            email: "mypos@balekagegael.com",
            username: "admin",
            password,
            phone: "+243 979 171 810",
            address: "123 Zangi Butondo, Goma, RDC",
            role: "admin",
        });

        await adminUser.save();

        const company = new Company({
            name: "MY POS",
            address: "123 Demo Street, City",
            phone: "+243 979 171 810",
            email: "contact@balekagegael.com",
            logo: path.join("images", "demologo.png"),
            isDemo: true,
            createdAt: new Date(),
        });

        await company.save();

        console.log("✅ Démo créée avec succès !");
        res.status(201).json({ message: "Démo créée", company, adminUser });
    } catch (error) {
        console.log("❌ Erreur lors de la création de la démo :", error);
        return next(new HttpError("Erreur interne du serveur", 500))
    }
};

module.exports = { createAdminAndCompany };
