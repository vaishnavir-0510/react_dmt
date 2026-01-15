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
  Divider,
  InputAdornment,
  Fade,
  Link,
  Grid,
  Chip,
} from '@mui/material';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailIcon from '@mui/icons-material/Email';
import DomainIcon from '@mui/icons-material/Domain';
import SyncIcon from '@mui/icons-material/Sync';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';

import { useRegisterMutation } from '../../store/api/authApi';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  setCredentials,
  setLoading,
  setError,
  clearError,
} from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

/* ================= TYPES ================= */

type RegisterFormData = {
  username: string;
  email: string;
  first_name: string | undefined;
  last_name: string | undefined;
  password: string;
  confirmPassword: string;
  domain_name: string;
};

/* ================= VALIDATION ================= */

const registerSchema = yup.object({
  username: yup.string().required('Username is required'),
  email: yup.string().required('Email is required').email(),
  first_name: yup.string().optional(),
  last_name: yup.string().optional(),
  password: yup.string().required().min(6),
  confirmPassword: yup
    .string()
    .required()
    .oneOf([yup.ref('password')], 'Passwords must match'),
  domain_name: yup.string().required('Domain name is required'),
});

/* ================= COMPONENT ================= */

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [registerApi, { isLoading }] = useRegisterMutation();
  const { error } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  useEffect(() => {
    setFocus('username');
    dispatch(clearError());
  }, [setFocus, dispatch]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      dispatch(setLoading(true));
      const { confirmPassword, ...payload } = data;
      const result = await registerApi(payload).unwrap();
      dispatch(setCredentials(result));
      navigate('/dashboard');
    } catch (err: any) {
      dispatch(setError(err?.data?.message || 'Registration failed'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: '60px' }, // ✅ outer margin 60
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
              alignItems: 'flex-start', // ✅ no vertical centering
              justifyContent: 'center',
              p: { xs: 3, md: 5 },
            }}
          >
            <Box
              sx={{
                textAlign: 'center',
                width: '100%',
                mt: 0, // ✅ remove top space
              }}
            >
              <img
                src="/images/doneeregister.png"
                alt="Register"
                style={{
                  maxWidth: '55%',
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto 0px', // ✅ VERY tight gap
                }}
              />

              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  mt: 0, // ✅ tight
                }}
              >
                Ready to take control?
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  maxWidth: 380,
                  mx: 'auto',
                  mt: 0.2, // ✅ almost touching image
                }}
              >
                Secure, fast and reliable Salesforce migration platform.
              </Typography>

              <Box
                sx={{
                  mt: 0.8,
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Chip icon={<SyncIcon />} label="Synced" sx={{ m: 0.4 }} />
                <Chip icon={<SecurityIcon />} label="Secure" sx={{ m: 0.4 }} />
                <Chip icon={<SpeedIcon />} label="Fast" sx={{ m: 0.4 }} />
              </Box>
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
                Create Account
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    {...register('first_name')}
                    error={!!errors.first_name}
                    helperText={errors.first_name?.message}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    {...register('last_name')}
                    error={!!errors.last_name}
                    helperText={errors.last_name?.message}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    {...register('username')}
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircleIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

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
                    type="password"
                    label="Password"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm Password"
                    {...register('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon />
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

              <Divider sx={{ my: 3 }} />

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={22} /> : 'Register'}
              </Button>

              <Typography align="center" sx={{ mt: 2 }}>
                Already have an account?{' '}
                <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer' }}>
                  Sign in
                </Link>
              </Typography>

              <Typography align="center" sx={{ mt: 1 }}>
                <Link onClick={() => navigate('/forgot-password')} sx={{ cursor: 'pointer' }}>
                  Forgot username/password?
                </Link>
              </Typography>
            </form>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};
