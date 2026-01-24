import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
} from "@mui/material";
import type { FilterDataRecord } from "../../../types";

interface FilterTableProps {
  records: FilterDataRecord[];
  columns: string[];
  searchTerm: string;
  highlightedRow: number | null;
}

export const FilterTable: React.FC<FilterTableProps> = ({
  records,
  columns,
  searchTerm,
  highlightedRow,
}) => {
  // Function to highlight search term in cell content
  const highlightText = (text: string | number | null | undefined): React.ReactNode => {
    if (!text || !searchTerm) return text?.toString() || "";

    const str = text.toString();
    const index = str.toLowerCase().indexOf(searchTerm.toLowerCase());
    
    if (index === -1) return str;

    const before = str.substring(0, index);
    const match = str.substring(index, index + searchTerm.length);
    const after = str.substring(index + searchTerm.length);

    return (
      <>
        {before}
        <Box component="span" sx={{ backgroundColor: "yellow", fontWeight: "bold" }}>
          {match}
        </Box>
        {after}
      </>
    );
  };

  if (records.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" textAlign="center" color="text.secondary">
          No data to display.
        </Typography>
      </Paper>
    );
  }

  if (columns.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" textAlign="center" color="text.secondary">
          No columns selected for display.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} elevation={1} sx={{ overflowX: 'auto' }}>
      <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "grey.50",
                    minWidth: "120px",
                    maxWidth: "300px",
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record, index) => (
              <TableRow
                key={index}
                data-row-index={index}
                sx={{
                  backgroundColor: highlightedRow === index ? "action.selected" : "inherit",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      maxWidth: "300px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {highlightText(record[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
  );
};
