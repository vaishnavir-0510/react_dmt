import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Fade,
  Link,
  Grid,
  InputAdornment,
} from '@mui/material';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import DomainIcon from '@mui/icons-material/Domain';
import SendIcon from '@mui/icons-material/Send';

import { useForgotPasswordMutation } from '../../store/api/authApi';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  setLoading,
  setError,
  clearError,
} from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

/* ================= TYPES ================= */

type ForgotPasswordFormData = {
  email: string;
  domain_name: string;
};

/* ================= VALIDATION ================= */

const forgotPasswordSchema = yup.object({
  email: yup.string().required('Email is required').email(),
  domain_name: yup.string().required('Domain name is required'),
});

/* ================= COMPONENT ================= */

export const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [forgotPasswordApi, { isLoading }] = useForgotPasswordMutation();
  const { error } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  useEffect(() => {
    setFocus('email');
    dispatch(clearError());
  }, [setFocus, dispatch]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordApi(data).unwrap();
      // Success - navigate to login or show success message
      navigate('/login');
    } catch (err: any) {
      // Error is handled by the mutation's onQueryStarted
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: '60px' },
        background: '#f8fafc',
      }}
    >
      <Fade in>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* ================= LEFT : BLUE / PURPLE ================= */}
          <Box
            sx={{
              flex: 1.7,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              p: { xs: 3, md: 5 },
            }}
          >
            <Box
              sx={{
                textAlign: 'center',
                width: '100%',
                mt: 0,
              }}
            >
              <img
                src="/images/doneeregister.png"
                alt="Forgot Password"
                style={{
                  maxWidth: '55%',
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto 0px',
                }}
              />

              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  mt: 0,
                }}
              >
                Reset Your Password
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  maxWidth: 380,
                  mx: 'auto',
                  mt: 0.2,
                }}
              >
                Enter your email and domain to receive password reset instructions.
              </Typography>
            </Box>
          </Box>

          {/* ================= RIGHT : FORM ================= */}
          <Box
            sx={{
              flex: 1,
              background: 'white',
              p: { xs: 3, md: 5 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <PersonAddIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="h5" fontWeight={700}>
                Forgot Password
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Domain Name"
                    {...register('domain_name')}
                    error={!!errors.domain_name}
                    helperText={errors.domain_name?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DomainIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                startIcon={<SendIcon />}
                disabled={isLoading}
                sx={{ mt: 3 }}
              >
                {isLoading ? 'Sending...' : 'Send to Email'}
              </Button>

              <Typography align="center" sx={{ mt: 2 }}>
                <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer' }}>
                  Back to Login
                </Link>
              </Typography>
            </form>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};
