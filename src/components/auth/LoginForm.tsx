import React, { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  Fade,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DomainIcon from '@mui/icons-material/Domain';
import { useAuth } from '../../hooks/useAuth';

const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
  domain_name: yup.string().required('Domain name is required'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted, isValid },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    setFocus('username');
  }, [setFocus]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'linear-gradient(to right, #ece9e6, #ffffff, #f6d365, #fda085)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Fade in>
        <Paper
          elevation={6}
          sx={{
            p: 5,
            borderRadius: 4,
            minWidth: 400,
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 8px 25px rgba(0,0,0,0.06)',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <LockOutlinedIcon
              color="primary"
              sx={{ fontSize: 48, mb: 1 }}
            />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Welcome Back
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
              Sign in to continue to your account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {typeof error === 'string'
                ? error
                : 'Login failed. Please check your credentials.'}
            </Alert>
          )}

          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Username"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              margin="normal"
              variant="outlined"
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircleIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              margin="normal"
              variant="outlined"
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Domain Name"
              {...register('domain_name')}
              error={!!errors.domain_name}
              helperText={errors.domain_name?.message ?? 'e.g., paas, dev, staging, prod'}
              margin="normal"
              variant="outlined"
              placeholder="e.g., paas, dev, staging, prod"
              autoComplete="organization"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DomainIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ my: 3 }} />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ py: 1.5, fontWeight: 600, textTransform: 'none', letterSpacing: 1 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={26} color="inherit" /> : 'Login'}
            </Button>
          </form>

          <Typography variant="caption" sx={{ display: 'block', mt: 3, textAlign: 'center', color: 'text.secondary'}}>
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </Typography>
        </Paper>
      </Fade>
    </Box>
  );
};
