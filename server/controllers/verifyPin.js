const User = require("../models/user");
const HttpError = require("../models/error");
const bcrypt = require("bcryptjs");

const verifyManager = async (req, res, next) => {
    try {
        const { username, pin } = req.body;

        if (!username || !pin) {
            return next(new HttpError("Nom d'utilisateur et PIN requis.", 400));
        }

        const user = await User.findOne({ username });

        if (!user) {
            return next(new HttpError("Utilisateur introuvable.", 404));
        }

        if (user.role !== "manager") {
            return next(new HttpError("Accès refusé : rôle non autorisé.", 403));
        }

        const isMatch = await bcrypt.compare(pin, user.password);
        if (!isMatch) {
            return next(new HttpError("PIN invalide.", 401));
        }

        res.status(200).json({ success: true, manager: user.username });

    } catch (error) {
        console.error("Erreur dans verifyManager:", error);
        return next(new HttpError("Erreur serveur lors de la vérification.", 500));
    }
};

module.exports = { verifyManager };
