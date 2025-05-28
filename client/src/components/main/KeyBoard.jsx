import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const LAYOUTS = {
  qwerty: [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m", "←"],
    ["123", "ESPACE", ".", "@", "OK"],
  ],
  azerty: [
    ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
    ["w", "x", "c", "v", "b", "n", "←"],
    ["123", "ESPACE", ".", "@", "OK"],
  ],
};

const NUMERIC_ROW = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["-", "_", "*", "/", "(", ")", "#", "+", "=", "%"],
  [",", ":", ";", "!", "?", "'", '"', "←"],
  ["ABC", "ESPACE", ".", "@", "OK"],
];

const DraggableContainer = ({ children }) => (
  <motion.div
    drag
    dragConstraints={{ top: -1000, bottom: 1000, left: -1000, right: 1000 }}
    className="fixed top-10 left-10 z-50 cursor-move"
  >
    {children}
  </motion.div>
);

const KeyBoard = ({ open, onClose, onKeyPress, layout = "azerty" }) => {
  const [isNumeric, setIsNumeric] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleKeyClick = (key) => {
    if (key === "OK") {
      onClose();
    } else if (key === "←") {
      setInputValue((prev) => {
        const newVal = prev.slice(0, -1);
        onKeyPress("BACKSPACE");
        return newVal;
      });
    } else if (key === "ESPACE") {
      setInputValue((prev) => {
        onKeyPress(" ");
        return prev + " ";
      });
    } else if (key === "123") {
      setIsNumeric(true);
    } else if (key === "ABC") {
      setIsNumeric(false);
    } else {
      const newChar = key.toLowerCase();
      setInputValue((prev) => prev + newChar);
      onKeyPress(newChar);
    }
  };

  useEffect(() => {
    setInputValue(""); // Reset input when dialog opens
  }, [open]);

  const currentLayout = isNumeric ? NUMERIC_ROW : LAYOUTS[layout];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-screen-xl">
        <DraggableContainer>
          <div className="rounded-2xl bg-white p-8 shadow-2xl border w-full max-w-screen-xl">
            <div className="mb-6 cursor-move">
              <DialogHeader>
                <DialogTitle className="text-4xl text-center">
                  Clavier Virtuel POS – {layout.toUpperCase()}
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* Barre d'affichage */}
            <div className="mb-6 px-6 py-5 border rounded-xl bg-gray-100 text-3xl font-mono select-none min-h-[4rem]">
              {inputValue || (
                <span className="text-gray-400">Tapez ici...</span>
              )}
            </div>

            <div className="space-y-6">
              {currentLayout.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex gap-4 justify-center flex-wrap"
                >
                  {row.map((key, index) => (
                    <Button
                      key={index}
                      onClick={() => handleKeyClick(key)}
                      className={`
                    h-24 text-3xl font-bold rounded-xl px-8
                    ${
                      key === "OK"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : key === "←"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : key === "ESPACE"
                        ? "flex-1 bg-blue-600 text-white hover:bg-blue-700 min-w-[300px]"
                        : key === "123" || key === "ABC"
                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                        : "bg-gray-100 text-black hover:bg-gray-300 w-24"
                    }
                  `}
                    >
                      {key === "ESPACE" ? "Espace" : key}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </DraggableContainer>
      </DialogContent>
    </Dialog>
  );
};

export default KeyBoard;
