const HttpError = require("../models/error");

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return next(new HttpError("Utilisateur non authentifié.", 401));
      }

      if (!allowedRoles.includes(user.role)) {
        return next(
          new HttpError(
            "Accès refusé : vous n'etes pas autorise a éffectuer cette action.",
            403
          )
        );
      }

      next();
    } catch (error) {
      console.log("Erreur dans checkRole middleware:", error);
      return next(new HttpError("Erreur interne.", 500));
    }
  };
};

module.exports = checkRole;
