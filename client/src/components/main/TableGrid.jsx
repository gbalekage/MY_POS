import React, { useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BadgeCheck, Clock } from "lucide-react";
import { UserContext } from "@/context/UserContext";

const TableGrid = ({ tables, onTableClick, selectedTableId }) => {
  const { user } = useContext(UserContext);
  const userId = user.id;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map((table) => {
        const isOccupied = table.status === "occupied";
        const isOwnedByUser =
          table.assignedServer?._id?.toString() === userId ||
          table.assignedServer?.toString() === userId;
        const isSelected = selectedTableId === table._id;

        // Déterminer la couleur de la bordure
        const bgColor = isSelected
          ? "text-blue-700 border-blue-200"
          : isOccupied
          ? isOwnedByUser
            ? "text-yellow-700 border-yellow-200"
            : "text-red-700 border-red-200"
          : "text-green-700 border-green-200";

        // Déterminer si la table est cliquable
        const isClickable = !isOccupied || isOwnedByUser;

        const icon = isOccupied ? (
          <Clock size={16} />
        ) : (
          <BadgeCheck size={16} />
        );
        const statusText = isOccupied
          ? isOwnedByUser
            ? "Votre commande"
            : "Occupée"
          : "Libre";

        return (
          <Card
            key={table._id}
            onClick={() => isClickable && onTableClick && onTableClick(table)}
            className={`transition-transform duration-150 ease-in-out select-none flex flex-col justify-center items-center rounded-2xl shadow-md border-2 ${bgColor} ${
              isClickable
                ? "cursor-pointer hover:shadow-lg"
                : "cursor-not-allowed opacity-60"
            } min-h-[120px]`}
          >
            <CardHeader className="p-2">
              <CardTitle className="text-xl text-center font-semibold">
                Table {table.tableNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center mt-2">
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-white shadow-sm ${
                  isOccupied
                    ? isOwnedByUser
                      ? "text-yellow-600"
                      : "text-red-600"
                    : "text-green-600"
                }`}
              >
                {icon}
                <span>{statusText}</span>
              </div>
              <p className="text-xs">
                {Number(table.totalAmount).toLocaleString("fr-FR")} FC
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TableGrid;
