const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;

const initPrinter = async (printerConfig) => {
  let printer = new ThermalPrinter({
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

module.exports = { initPrinter };
