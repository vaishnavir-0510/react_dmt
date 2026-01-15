import React from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export const LoadIterationSlideIn = ({ open, onClose, row }: any) => {
  if (!row) return null;

  const statusColor =
    row.status === "Completed"
      ? "success"
      : row.status === "Failed"
      ? "error"
      : "warning";

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Load Details</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Typography fontWeight="bold">ID</Typography>
        <Typography mb={2}>{row.id}</Typography>

        <Typography fontWeight="bold">Job ID</Typography>
        <Typography mb={2}>{row.job_id}</Typography>

        <Typography fontWeight="bold">Status</Typography>
        <Chip
          label={row.status}
          color={statusColor as any}
          sx={{ mb: 2 }}
        />

        <Typography fontWeight="bold">Operation</Typography>
        <Typography mb={2}>{row.operation}</Typography>

        <Typography fontWeight="bold">Record Count</Typography>
        <Typography mb={2}>{row.record_ct}</Typography>

        <Typography fontWeight="bold">Success / Failed</Typography>
        <Typography mb={2}>
          {row.success_ct} / {row.failed_ct}
        </Typography>

        <Typography fontWeight="bold">Duration</Typography>
        <Typography mb={2}>{row.duration}</Typography>

        <Typography fontWeight="bold">Start</Typography>
        <Typography mb={2}>{row.start_dt}</Typography>

        <Typography fontWeight="bold">End</Typography>
        <Typography mb={2}>{row.end_dt}</Typography>

        <Typography fontWeight="bold">Files</Typography>
        <Typography>Success: {row.success_file}</Typography>
        <Typography>Error: {row.error_file}</Typography>
        <Typography mb={2}>Unprocessed: {row.unprocessed_file}</Typography>

        <Divider sx={{ my: 2 }} />

        <Typography fontWeight="bold">Full Raw JSON</Typography>
        <pre style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(row, null, 2)}
        </pre>
      </Box>
    </Drawer>
  );
};
