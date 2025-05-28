const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
const Store = require("../models/store");
const Printer = require("../models/printer");
const Sale = require("../models/sales");
const SignedBill = require("../models/signedBills");
const PaidSigendBills = require("../models/paidSigendBills");
const Item = require("../models/item");
const mongoose = require("mongoose");
const Company = require("../models/company");
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

const printTestPage = async (printerConfig) => {
  try {
    const printer = await initPrinter(printerConfig);

    const company = await Company.findOne();
    if (!company) {
      console.error("Aucune information sur l'entreprise trouvée.");
      return false;
    }

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("Printer not connected.");
    }

    if (company.logo) {
      const logoPath = path.join(
        __dirname,
        "../images/",
        path.basename(company.logo)
      );

      if (fs.existsSync(logoPath)) {
        console.log("Logo trouvé, redimensionnement...");

        const resizedLogoPath = path.join(
          __dirname,
          "../images/resized-logo.png"
        );
        await sharp(logoPath)
          .resize({ width: 300 })
          .toFormat("png")
          .toFile(resizedLogoPath);

        console.log("Logo redimensionné, envoi à l'imprimante...");
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

    printer.alignCenter();
    printer.println("*** TEST IMPRIMENTE ***");
    printer.drawLine();
    printer.println(`Nom de l'imprimente: ${printerConfig.name}`);
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error(
      "Erreur lors de l'impression de le page test de l'imprimente :",
      error
    );
    return false;
  }
};

const printOrder = async (items, storeId, attendantName) => {
  try {
    const storeWithPrinter = await Store.findById(storeId).populate("printer");

    if (!storeWithPrinter || !storeWithPrinter.printer) {
      throw new Error(
        `Aucune configuration d'imprimante trouvée pour le store`
      );
    }

    const printerConfig = storeWithPrinter.printer;
    const printer = await initPrinter(printerConfig);

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error(`Imprimante pour le store non connectée.`);
    }

    // Header
    printer.alignCenter();
    printer.bold(true);
    printer.println("=== COMMANDE ===");
    printer.bold(false);
    printer.drawLine();

    // Store information
    printer.alignLeft();
    printer.println(`Magasin : ${storeWithPrinter.name}`);
    printer.println(`Serveur : ${attendantName}`);
    printer.println(`Date    : ${new Date().toLocaleString("fr-FR")}`);
    printer.drawLine();

    // Table header
    printer.bold(true);
    printer.println("Article                 Qté");
    printer.bold(false);
    printer.println("------------------------------");

    // Table content
    items.forEach((item) => {
      const itemName = item.itemName;
      const quantity = item.quantity;

      const formattedItemName =
        itemName.length > 20
          ? itemName.substring(0, 20)
          : itemName.padEnd(20, " ");
      const formattedQuantity = String(quantity).padStart(5, " ");

      printer.println(`${formattedItemName} ${formattedQuantity}`);
    });

    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur d'impression de la commande:", error);
    throw new Error(
      `Erreur d'impression pour le store ${storeId}: ${error.message}`
    );
  }
};

const printInvoice = async (invoice) => {
  try {
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

    let printer = await initPrinter(printerConfig);

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("Bar Printer également non connectée.");
    }

    const company = await Company.findOne();
    if (!company) {
      console.error("Aucune information sur l'entreprise trouvée.");
      return false;
    }

    if (company.logo) {
      const logoPath = path.join(
        __dirname,
        "../images/",
        path.basename(company.logo)
      );

      if (fs.existsSync(logoPath)) {
        console.log("Logo trouvé, redimensionnement...");

        const resizedLogoPath = path.join(
          __dirname,
          "../images/resized-logo.png"
        );
        await sharp(logoPath)
          .resize({ width: 300 })
          .toFormat("png")
          .toFile(resizedLogoPath);

        console.log("Logo redimensionné, envoi à l'imprimante...");
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

    // Titre
    printer.alignCenter();
    printer.bold(true);
    printer.println("FACTURE");
    printer.setTextNormal();

    printer.bold(false);
    printer.drawLine();
    printer.alignLeft();
    printer.println(`Numéro : ${invoice.invoiceNumber}`);
    printer.println(`Date    : ${invoice.date}`);
    printer.println(`Serveur : ${invoice.serverName}`);
    printer.drawLine();

    // En-tête du tableau
    printer.bold(true);
    printer.println("Article                 Qté    PU       Total");
    printer.setTextNormal();
    printer.drawLine();

    invoice.items.forEach((item) => {
      const itemName =
        item.itemName.length > 16
          ? item.itemName.substring(0, 16) + "."
          : item.itemName.padEnd(17, " ");
      const quantity = String(item.quantity).padStart(3, " ");
      const unitPrice = item.unitPrice.toLocaleString().padStart(7, " ");
      const totalPrice = (item.unitPrice * item.quantity)
        .toLocaleString()
        .padStart(9, " ");

      printer.println(
        `${itemName}      ${quantity}  ${unitPrice}  ${totalPrice}`
      );
    });

    printer.drawLine();

    // Total
    printer.alignRight();
    printer.println(`Total: ${invoice.totalAmount.toLocaleString()}`);
    printer.setTextNormal();
    printer.alignLeft();

    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur d'impression de la facture:", error);
    throw new Error(`Erreur d'impression de la facture pour le store`);
  }
};

const printCancellation = async (items, storeId, attendant) => {
  try {
    const storeWithPrinter = await Store.findById(storeId).populate("printer");

    if (!storeWithPrinter || !storeWithPrinter.printer) {
      throw new Error(
        `Aucune configuration d'imprimante trouvée pour le store`
      );
    }

    const printerConfig = storeWithPrinter.printer;
    const printer = await initPrinter(printerConfig);

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error(`Imprimante pour le store non connectée.`);
    }

    // Alignement et mise en forme
    printer.alignCenter();
    printer.bold(true);
    printer.println("=== ARTICLE SUPPRIMER ===");
    printer.bold(false);
    printer.drawLine();

    // Store information
    printer.alignLeft();
    printer.println(`Magasin : ${storeWithPrinter.name}`);
    printer.println(`Serveur : ${attendant}`);
    printer.println(`Date    : ${new Date().toLocaleString("fr-FR")}`);
    printer.drawLine();

    // Table header
    printer.bold(true);
    printer.println("Article                 Qté");
    printer.bold(false);
    printer.println("------------------------------");

    // Table content
    items.forEach((item) => {
      const itemName = item.itemName;
      const quantity = item.quantity;

      const formattedItemName =
        itemName.length > 20
          ? itemName.substring(0, 20)
          : itemName.padEnd(20, " ");
      const formattedQuantity = String(quantity).padStart(5, " ");

      printer.println(`${formattedItemName} ${formattedQuantity}`);
    });

    printer.cut();
    await printer.execute();
  } catch (error) {
    console.error("Erreur d'impression des articles supprimés:", error);
    throw new Error("Erreur d'impression");
  }
};

const printReceipt = async (saleOrId, order) => {
  try {
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

    let printer = await initPrinter(printerConfig);

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("Bar Printer également non connectée.");
    }

    let sale;
    if (
      typeof saleOrId === "string" ||
      saleOrId instanceof mongoose.Types.ObjectId
    ) {
      sale = await Sale.findById(saleOrId)
        .populate({
          path: "items.item",
          select: "name",
        })
        .populate({
          path: "attendant",
          select: "name",
        });
      if (!sale) {
        throw new Error("Vente introuvable pour impression.");
      }
    } else {
      sale = saleOrId;
    }

    const company = await Company.findOne();
    if (!company) {
      console.error("Aucune information sur l'entreprise trouvée.");
      return false;
    }

    if (company.logo) {
      const logoPath = path.join(
        __dirname,
        "../images/",
        path.basename(company.logo)
      );

      if (fs.existsSync(logoPath)) {
        console.log("Logo trouvé, redimensionnement...");

        const resizedLogoPath = path.join(
          __dirname,
          "../images/resized-logo.png"
        );
        await sharp(logoPath)
          .resize({ width: 300 })
          .toFormat("png")
          .toFile(resizedLogoPath);

        console.log("Logo redimensionné, envoi à l'imprimante...");
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

    printer.alignCenter();
    printer.bold(true);
    printer.println("REÇU CLIENT");
    printer.bold(false);
    printer.drawLine();

    printer.alignLeft();
    printer.println(`Commandé à: ${order.createdAt.toLocaleString("fr-FR")}`);
    printer.println(
      `Payé à : ${new Date(sale.createdAt).toLocaleString("fr-FR")}`
    );
    printer.println(`Serveur : ${sale.attendant?.name || "N/A"}`);
    printer.println(`Mode de payement : ${sale.paymentMethod || "cash"}`);
    printer.drawLine();

    printer.bold(true);
    printer.println("Article                 Qté      PU        Total");
    printer.bold(false);
    printer.drawLine();

    sale.items.forEach((item) => {
      if (!item || !item.item || !item.item.name) return; // Check if item or itemName is present

      const itemName =
        item.item.name.length > 16
          ? item.item.name.substring(0, 16) + "."
          : item.item.name.padEnd(17, " ");
      const quantity = String(item.quantity || 0).padStart(3, " ");
      const unitPrice = Number(item.price) || 0;
      const totalPrice = Number(item.total) || 0;
      printer.println(
        `${itemName}      ${quantity}       ${unitPrice}      ${totalPrice}`
      );
    });

    printer.drawLine();
    printer.alignRight();

    printer.println(`Total : ${sale.totalAmount} FC`);
    printer.println(`Reçu   : ${sale.receivedAmount} FC`);
    printer.println(`Rendu  : ${sale.change} FC`);

    printer.alignCenter();
    printer.drawLine();
    printer.println("Merci pour votre visite !");
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur d'impression du reçu:", error);
    throw new Error(error.message);
  }
};

const printSignedBill = async (saleOrId, order) => {
  try {
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

    let printer = await initPrinter(printerConfig);

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("Bar Printer également non connectée.");
    }

    let sale;
    if (
      typeof saleOrId === "string" ||
      saleOrId instanceof mongoose.Types.ObjectId
    ) {
      sale = await SignedBill.findById(saleOrId)
        .populate({
          path: "items.item",
          select: "name",
        })
        .populate({
          path: "attendant",
          select: "name",
        })
        .populate({
          path: "customer",
          select: "fullName",
        });
      if (!sale) throw new Error("Vente introuvable pour impression.");

      console.log("Sale details: ", sale);
    } else {
      sale = saleOrId;
    }

    const company = await Company.findOne();
    if (!company) {
      console.error("Aucune information sur l'entreprise trouvée.");
      return false;
    }

    if (company.logo) {
      const logoPath = path.join(
        __dirname,
        "../images/",
        path.basename(company.logo)
      );

      if (fs.existsSync(logoPath)) {
        console.log("Logo trouvé, redimensionnement...");

        const resizedLogoPath = path.join(
          __dirname,
          "../images/resized-logo.png"
        );
        await sharp(logoPath)
          .resize({ width: 300 })
          .toFormat("png")
          .toFile(resizedLogoPath);

        console.log("Logo redimensionné, envoi à l'imprimante...");
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

    printer.alignCenter();
    printer.bold(true);
    printer.println("FACTURE SIGNEE");
    printer.bold(false);
    printer.drawLine();

    printer.alignLeft();
    printer.println(`Commandé à: ${order.createdAt.toLocaleString("fr-FR")}`);
    printer.println(
      `Signé à : ${new Date(sale.createdAt).toLocaleString("fr-FR")}`
    );
    printer.println(`Client: ${sale.customer?.fullName || "N/A"}`);
    printer.println(`Serveur : ${sale.attendant?.name || "N/A"}`);
    printer.drawLine();

    printer.bold(true);
    printer.println("Article                 Qté       PU        Total");
    printer.bold(false);
    printer.drawLine();

    sale.items.forEach((item) => {
      if (!item || !item.item || !item.item.name) return;

      const itemName =
        item.item.name.length > 16
          ? item.item.name.substring(0, 16) + "."
          : item.item.name.padEnd(17, " ");
      const quantity = String(item.quantity || 0).padStart(3, " ");
      const unitPrice = Number(item.price) || 0;
      const totalPrice = Number(item.total) || 0;
      printer.println(
        `${itemName}      ${quantity}        ${unitPrice}     ${totalPrice}`
      );
    });

    printer.alignCenter();
    printer.drawLine();
    printer.println("Merci pour votre visite !");
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur d'impression du reçu:", error);
  }
};

const signedBillFromAdmin = async (order) => {
  try {
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

    let printer = await initPrinter(printerConfig);

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("Bar Printer également non connectée.");
    }

    const company = await Company.findOne();
    if (!company) {
      console.error("Aucune information sur l'entreprise trouvée.");
      return false;
    }

    if (company.logo) {
      const logoPath = path.join(
        __dirname,
        "../images/",
        path.basename(company.logo)
      );

      if (fs.existsSync(logoPath)) {
        console.log("Logo trouvé, redimensionnement...");

        const resizedLogoPath = path.join(
          __dirname,
          "../images/resized-logo.png"
        );
        await sharp(logoPath)
          .resize({ width: 300 })
          .toFormat("png")
          .toFile(resizedLogoPath);

        console.log("Logo redimensionné, envoi à l'imprimante...");
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

    printer.alignCenter();
    printer.bold(true);
    printer.println("FACTURE SIGNEE");
    printer.bold(false);
    printer.drawLine();

    printer.alignLeft();
    printer.println(
      `Signé à : ${new Date(order.createdAt).toLocaleString("fr-FR")}`
    );
    printer.println(`Client: ${order.customer?.fullName || "N/A"}`);
    printer.println(`Serveur : ${order.attendant?.name || "N/A"}`);
    printer.drawLine();

    printer.bold(true);
    printer.println("Article                 Qté       PU        Total");
    printer.bold(false);
    printer.drawLine();

    order.items.forEach((item) => {
      if (!item || !item.item || !item.item.name) return;

      const itemName =
        item.item.name.length > 16
          ? item.item.name.substring(0, 16) + "."
          : item.item.name.padEnd(17, " ");
      const quantity = String(item.quantity || 0).padStart(3, " ");
      const unitPrice = Number(item.price) || 0;
      const totalPrice = Number(item.total) || 0;
      printer.println(
        `${itemName}      ${quantity}        ${unitPrice}     ${totalPrice}`
      );
    });

    printer.alignCenter();
    printer.drawLine();
    printer.println("Merci pour votre visite !");
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur d'impression du reçu:", error);
  }
};

const printPaidSignedBill = async (saleOrId, signedBill) => {
  try {
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

    let printer = await initPrinter(printerConfig);

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("Bar Printer également non connectée.");
    }

    let sale;
    if (
      typeof saleOrId === "string" ||
      saleOrId instanceof mongoose.Types.ObjectId
    ) {
      sale = await PaidSigendBills.findById(saleOrId)
        .populate({
          path: "items.item",
          select: "name",
        })
        .populate({
          path: "attendant",
          select: "name",
        })
        .populate({
          path: "customer",
          select: "fullName",
        });
      if (!sale) throw new Error("Facture introuvable pour impression.");
    } else {
      sale = saleOrId;
    }

    const company = await Company.findOne();
    if (!company) {
      console.error("Aucune information sur l'entreprise trouvée.");
      return false;
    }

    if (company.logo) {
      const logoPath = path.join(
        __dirname,
        "../images/",
        path.basename(company.logo)
      );

      if (fs.existsSync(logoPath)) {
        console.log("Logo trouvé, redimensionnement...");

        const resizedLogoPath = path.join(
          __dirname,
          "../images/resized-logo.png"
        );
        await sharp(logoPath)
          .resize({ width: 300 })
          .toFormat("png")
          .toFile(resizedLogoPath);

        console.log("Logo redimensionné, envoi à l'imprimante...");
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

    printer.alignCenter();
    printer.bold(true);
    printer.println("FACTURE SIGNEE PAYE");
    printer.bold(false);
    printer.drawLine();

    printer.alignLeft();
    printer.println(
      `Date de signature: ${signedBill.createdAt.toLocaleString("fr-FR")}`
    );
    printer.println(
      `Date de payement : ${new Date(sale.createdAt).toLocaleString("fr-FR")}`
    );
    printer.println(`Client: ${sale.customer?.fullName || "N/A"}`);
    printer.println(`Serveur : ${sale.attendant?.name || "N/A"}`);
    printer.drawLine();

    printer.bold(true);
    printer.println("Article                 Qté    PU       Total");
    printer.bold(false);
    printer.drawLine();

    sale.items.forEach((item) => {
      if (!item || !item.item || !item.item.name) return;

      const itemName =
        item.item.name.length > 16
          ? item.item.name.substring(0, 16) + "."
          : item.item.name.padEnd(17, " ");
      const quantity = String(item.quantity || 0).padStart(3, " ");
      const unitPrice = Number(item.price) || 0;
      const totalPrice = Number(item.total) || 0;
      printer.println(
        `${itemName}      ${quantity}     ${unitPrice}     ${totalPrice}`
      );
    });

    printer.drawLine();
    printer.alignRight();

    printer.println(`Total : ${sale.totalAmount} FC`);
    printer.println(`Reçu   : ${sale.receivedAmount} FC`);
    printer.println(`Rendu  : ${sale.change} FC`);

    printer.alignCenter();
    printer.drawLine();
    printer.println("Merci pour votre visite !");
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur d'impression du reçu:", error);
  }
};

module.exports = {
  initPrinter,
  printTestPage,
  printOrder,
  printInvoice,
  printCancellation,
  printReceipt,
  printSignedBill,
  printPaidSignedBill,
  signedBillFromAdmin
};
