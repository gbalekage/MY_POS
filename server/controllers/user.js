const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/error");

const register = async (req, res, next) => {
  try {
    const { name, username, email, phone, address, role, password, password2 } =
      req.body;

    const createdByUserId = req.user.id;

    if (
      !name ||
      !username ||
      !email ||
      !phone ||
      !address ||
      !role ||
      !password
    ) {
      return next(new HttpError("Vieillez remplir tout les champs.", 422));
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return next(
        new HttpError("Email ou nom d’utilisateur déjà utilisé.", 422)
      );
    }

    if (password !== password2) {
      return next(
        new HttpError("Les mots de passe ne correspondent pas.", 422)
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      email,
      phone,
      address,
      role,
      password: hashedPassword,
      activityLogs: [
        {
          action: "CREATE_USER",
          description: `Utilisateur ${username} a été créé.`,
          user: createdByUserId || null,
        },
      ],
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès.",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log("Erreur lors de la création de l’utilisateur:", error);
    return next(new HttpError(Error, 500));
  }
};

const login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return next(new HttpError("Veuillez remplir tous les champs.", 422));
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      return next(new HttpError("Utilisateur non trouvé.", 404));
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return next(new HttpError("Mot de passe incorrect.", 401));
    }

    if (!user.isActive) {
      return next(new HttpError("Votre compte est désactivé.", 403));
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    user.lastLogin = new Date();
    user.loginHistory.push({
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      date: new Date(),
    });

    user.activityLogs.push({
      action: "LOGIN",
      description: "Connexion réussie.",
      user: user._id,
    });

    await user.save();

    res.status(200).json({
      message: "Connexion réussie.",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        token: token,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res
      .status(500)
      .json({ message: "Erreur serveur, impossible de se connecter." });
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("assignedTables");
    res.status(200).json(users);
  } catch (error) {
    return next(new HttpError(error, 500));
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-password")
      .populate("assignedTables");

    res.status(200).json(user);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const updateUser = async (req, res, next) => {
  try {
    const {
      name,
      username,
      email,
      phone,
      address,
      role,
      oldPassword,
      password,
      password2,
      isActive,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new HttpError("Utilisateur non trouvé.", 404));
    }

    if (password) {
      if (!oldPassword) {
        return next(
          new HttpError("Veuillez entrer l'ancien mot de passe.", 422)
        );
      }

      if (password !== password2) {
        return next(
          new HttpError("Les mots de passe ne correspondent pas.", 422)
        );
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return next(new HttpError("Ancien mot de passe incorrect.", 422));
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (name) user.name = name;
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    if (role && req.user.role === "admin") {
      user.role = role;
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    user.activityLogs.push({
      action: "UPDATE_USER",
      description: `L'utilisateur ${user.username} a été mis à jour.`,
      user: req.user.id,
    });

    const updatedUser = await user.save();

    const { password: pwd, ...userWithoutPassword } = updatedUser.toObject();

    res.status(200).json({
      message: "Utilisateur mis à jour avec succès.",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.log("Erreur lors de la mise à jour de l'utilisateur:", error);
    return next(new HttpError(error, 500));
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new HttpError("Utilisateur non trouvé", 404));
    }
    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'Utilisateur:", error);
    return next(new HttpError(error, 500));
  }
};

module.exports = {
  register,
  login,
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
};
