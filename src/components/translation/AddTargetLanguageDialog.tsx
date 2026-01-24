import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon, Check as CheckIcon } from '@mui/icons-material';
import { useGetSupportedLanguagesQuery, type SupportedLanguage } from '../../services/translationApi';

interface AddTargetLanguageDialogProps {
  open: boolean;
  onClose: () => void;
  onAddLanguage?: (language: SupportedLanguage) => Promise<void>;
  isGenerating?: boolean;
}

const AddTargetLanguageDialog: React.FC<AddTargetLanguageDialogProps> = ({
  open,
  onClose,
  onAddLanguage,
  isGenerating = false,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: languages = [], isLoading, error } = useGetSupportedLanguagesQuery();

  const filteredLanguages = languages.filter(language =>
    language.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    language.locale_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLanguageSelect = (language: SupportedLanguage) => {
    setSelectedLanguage(language);
  };

  const handleAddLanguage = async () => {
    if (selectedLanguage && onAddLanguage) {
      await onAddLanguage(selectedLanguage);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedLanguage(null);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 9999 }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Add Target Language</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
          Select the target language you want to add
        </Typography>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search languages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Languages List */}
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
              Failed to load languages
            </Typography>
          ) : (
            <List>
              {filteredLanguages.map((language) => (
                <ListItem key={language.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleLanguageSelect(language)}
                    selected={selectedLanguage?.id === language.id}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemText
                      primary={`${language.label} (${language.locale_code})`}
                      secondary={language.language_type}
                    />
                    {selectedLanguage?.id === language.id && (
                      <CheckIcon color="primary" />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          disabled
          sx={{ opacity: 0.5 }}
        >
          Import from file
        </Button>
        <Button
          onClick={handleAddLanguage}
          variant="contained"
          disabled={!selectedLanguage || isGenerating}
          startIcon={isGenerating ? <CircularProgress size={20} /> : null}
          sx={{
            bgcolor: '#6366f1',
            '&:hover': { bgcolor: '#5555d8' },
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate with AI'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTargetLanguageDialog;