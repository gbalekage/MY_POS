const Company = require("../models/company");
const HttpError = require("../models/error");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const addCompany = async (req, res, next) => {
  try {
    const { name, address, phone, email } = req.body;
    if (!name || !address || !phone || !email) {
      return next(new HttpError("Toutes le champ sont requis", 422));
    }

    const company = await Company.findOne({ name });
    if (company) {
      return next(new HttpError("Ces information existe déjà", 422));
    }

    let logoPath = null;
    if (req.files && req.files.logo) {
      const logo = req.files.logo;
      const fileExt = path.extname(logo.name);
      const allowedExt = [".png"];

      if (!allowedExt.includes(fileExt.toLowerCase())) {
        return next(
          new HttpError(
            "Type de fichié invalide. On accepte seulement les PNG",
            400
          )
        );
      }

      const fileName = uuid() + fileExt;
      const uploadPath = path.join(__dirname, "../images/", fileName);

      logo.mv(uploadPath, (err) => {
        if (err) {
          console.error(err);
          return next(new HttpError("Failed to upload logo", 500));
        }
      });
      logoPath = `/images/${fileName}`;
    }

    const newCompany = await Company.create({
      name,
      address,
      phone,
      email,
      logo: logoPath
    });

    res.status(201).json({
      message: "The company was added",
      company: {
        id: newCompany._id,
        name: newCompany.name,
        email: newCompany.email,
        logo: newCompany.logo,
      },
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Failed to add the company", 500));
  }
};

const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findOne();
    res.status(200).json(company);
  } catch (error) {
    console.log(
      "Erreur lors de la récuperation des information de l'entreprise",
      error
    );
    return next(
      new HttpError(
        "Erreur lors de la récuperation des information de l'entreprise",
        500
      )
    );
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params

    const company = await Company.findById(id);
    if (!company) {
      return next(new HttpError("Information sur entreprise introuvable", 404))
    }
    res.status(200).json(company);
  } catch (error) {
    console.log(
      "Erreur lors de la récuperation des information de l'entreprise",
      error
    );
    return next(
      new HttpError(
        "Erreur lors de la récuperation des information de l'entreprise",
        500
      )
    );
  }
};

const editCompany = async (req, res, next) => {
  try {
    const { name, address, phone, email } = req.body;
    const company = await Company.findById(req.params.id);
    if (!company) {
      return next(new HttpError("Entreprise non trouvée", 404));
    }

    if (name) company.name = name;
    if (address) company.address = address;
    if (phone) company.phone = phone;
    if (email) company.email = email;

    const updatedCompany = await company.save();

    res.status(200).json(updatedCompany);
  } catch (error) {
    console.log(
      "Erreur lors de la mise a jours des information de l'entreprise",
      error
    );
    return next(
      new HttpError(
        "Erreur lors de la mise a jours des information de l'entreprise",
        500
      )
    );
  }
};

const addLogo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.files || !req.files.logo) {
      return next(new HttpError("Aucun logo fourni", 422));
    }

    const company = await Company.findById(id);
    if (!company) {
      return next(new HttpError("Entreprise non trouvée", 404));
    }

    const { logo } = req.files;
    if (logo.size > 500000) {
      return next(
        new HttpError(
          "Le fichier selectionné est trop large, il doit être inférieur à 500kb",
          422
        )
      );
    }

    // Ensure images directory exists
    const imagesDir = path.join(__dirname, "..", "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Delete old logo if exists and is not the default
    if (
      company.logo &&
      company.logo !== "/images/default-image.jpg" &&
      company.logo !== "default-image.jpg"
    ) {
      let oldLogoFile = company.logo.replace(/^\/images\//, "");
      const oldLogoPath = path.join(imagesDir, oldLogoFile);
      if (fs.existsSync(oldLogoPath)) {
        try {
          fs.unlinkSync(oldLogoPath);
        } catch (err) {
          console.error("Erreur lors de la suppression de l'ancien logo:", err);
        }
      }
    }

    let fileName = logo.name;
    let splittedFilename = fileName.split(".");
    let newFileName =
      splittedFilename[0] +
      uuid() +
      "." +
      splittedFilename[splittedFilename.length - 1];
    const uploadPath = path.join(imagesDir, newFileName);

    logo.mv(uploadPath, async (err) => {
      if (err) {
        return next(
          new HttpError("Erreur lors de l'upload du logo: " + err, 500)
        );
      }

      // Save the logo as /images/newFileName in the DB
      const updatedLogo = await Company.findByIdAndUpdate(
        id,
        { logo: `/images/${newFileName}` },
        { new: true }
      );
      if (!updatedLogo) {
        return next(
          new HttpError(
            "Impossible de changer le logo de l'entreprise, réessayez plus tard",
            422
          )
        );
      }
      res.status(200).json(updatedLogo);
    });
  } catch (error) {
    return next(new HttpError(error.message || error, 500));
  }
};

module.exports = { addCompany, editCompany, addLogo, getCompany, getCompanyById };
