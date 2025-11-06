import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ASONIPED Digital API',
      version: '1.0.0',
      description: 'API documentation for ASONIPED Digital platform',
      contact: {
        name: 'ASONIPED Digital',
        email: 'admin@asoniped.org'
      }
    },
    servers: [
      {
        url: (() => {
          if (process.env.BACKEND_URL) {
            return process.env.BACKEND_URL.startsWith('http') 
              ? process.env.BACKEND_URL 
              : `https://${process.env.BACKEND_URL}`;
          }
          if (process.env.API_URL) {
            return process.env.API_URL.startsWith('http') 
              ? process.env.API_URL 
              : `https://${process.env.API_URL}`;
          }
          if (process.env.RAILWAY_STATIC_URL) {
            return process.env.RAILWAY_STATIC_URL.startsWith('http') 
              ? process.env.RAILWAY_STATIC_URL 
              : `https://${process.env.RAILWAY_STATIC_URL}`;
          }
          if (process.env.RAILWAY_PUBLIC_DOMAIN) {
            return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
          }
          return 'http://localhost:3000';
        })(),
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            full_name: {
              type: 'string',
              description: 'Full name'
            },
            phone: {
              type: 'string',
              description: 'Phone number'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              description: 'User role'
            }
          }
        },
        Workshop: {
          type: 'object',
          required: ['titulo', 'ubicacion', 'descripcion', 'materiales', 'aprender', 'capacidad'],
          properties: {
            id: {
              type: 'integer',
              description: 'Workshop ID'
            },
            titulo: {
              type: 'string',
              description: 'Workshop title'
            },
            ubicacion: {
              type: 'string',
              description: 'Workshop location'
            },
            descripcion: {
              type: 'string',
              description: 'Workshop description'
            },
            materiales: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Required materials'
            },
            aprender: {
              type: 'string',
              description: 'What participants will learn'
            },
            capacidad: {
              type: 'integer',
              description: 'Maximum participants'
            },
            fecha: {
              type: 'string',
              format: 'date',
              description: 'Workshop date'
            },
            hora: {
              type: 'string',
              description: 'Workshop time'
            },
            imagen: {
              type: 'string',
              description: 'Workshop image URL'
            }
          }
        },
        WorkshopEnrollment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Enrollment ID'
            },
            user_id: {
              type: 'integer',
              description: 'User ID'
            },
            workshop_id: {
              type: 'integer',
              description: 'Workshop ID'
            },
            status: {
              type: 'string',
              enum: ['enrolled', 'cancelled'],
              description: 'Enrollment status'
            },
            enrollment_date: {
              type: 'string',
              format: 'date-time',
              description: 'Enrollment date'
            },
            notes: {
              type: 'string',
              description: 'Enrollment notes'
            }
          }
        },
        Volunteer: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Volunteer ID'
            },
            full_name: {
              type: 'string',
              description: 'Full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            phone: {
              type: 'string',
              description: 'Phone number'
            },
            availability: {
              type: 'string',
              description: 'Availability'
            },
            skills: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Skills and interests'
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              description: 'Application status'
            }
          }
        },
        Donation: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Donation ID'
            },
            donor_name: {
              type: 'string',
              description: 'Donor name'
            },
            amount: {
              type: 'number',
              description: 'Donation amount'
            },
            currency: {
              type: 'string',
              description: 'Currency code'
            },
            payment_method: {
              type: 'string',
              description: 'Payment method'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              description: 'Payment status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        Record: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Record ID'
            },
            record_number: {
              type: 'string',
              description: 'Record number'
            },
            user_id: {
              type: 'integer',
              description: 'User ID'
            },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
              description: 'Record status'
            },
            phase: {
              type: 'string',
              enum: ['phase1', 'phase2', 'phase3', 'completed'],
              description: 'Current phase'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        AttendanceRecord: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Attendance record ID'
            },
            activity_track_id: {
              type: 'integer',
              description: 'Activity track ID'
            },
            beneficiario_id: {
              type: 'integer',
              description: 'Beneficiary ID'
            },
            attendance_date: {
              type: 'string',
              format: 'date-time',
              description: 'Attendance date and time'
            },
            attendance_type: {
              type: 'string',
              enum: ['qr_scan', 'manual'],
              description: 'Type of attendance record'
            },
            notes: {
              type: 'string',
              description: 'Additional notes'
            }
          }
        },
        AttendanceAnalytics: {
          type: 'object',
          properties: {
            total_attendance: {
              type: 'integer',
              description: 'Total attendance count'
            },
            qr_scans: {
              type: 'integer',
              description: 'QR scan attendance count'
            },
            manual_entries: {
              type: 'integer',
              description: 'Manual entry attendance count'
            },
            beneficiaries: {
              type: 'integer',
              description: 'Beneficiary attendance count'
            },
            guests: {
              type: 'integer',
              description: 'Guest attendance count'
            },
            date_range: {
              type: 'object',
              properties: {
                from: { type: 'string', format: 'date' },
                to: { type: 'string', format: 'date' }
              }
            }
          }
        },
        ActivityTrack: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Activity track ID'
            },
            name: {
              type: 'string',
              description: 'Activity name'
            },
            description: {
              type: 'string',
              description: 'Activity description'
            },
            start_date: {
              type: 'string',
              format: 'date',
              description: 'Activity start date'
            },
            end_date: {
              type: 'string',
              format: 'date',
              description: 'Activity end date'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'completed'],
              description: 'Activity status'
            }
          }
        },
        VolunteerForm: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Volunteer form ID'
            },
            full_name: {
              type: 'string',
              description: 'Full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            phone: {
              type: 'string',
              description: 'Phone number'
            },
            availability: {
              type: 'string',
              description: 'Availability schedule'
            },
            skills: {
              type: 'array',
              items: { type: 'string' },
              description: 'Skills and interests'
            },
            experience: {
              type: 'string',
              description: 'Previous experience'
            },
            motivation: {
              type: 'string',
              description: 'Motivation for volunteering'
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              description: 'Application status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Application date'
            }
          }
        },
        VolunteerOption: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Volunteer option ID'
            },
            title: {
              type: 'string',
              description: 'Option title'
            },
            description: {
              type: 'string',
              description: 'Option description'
            },
            requirements: {
              type: 'string',
              description: 'Requirements'
            },
            schedule: {
              type: 'string',
              description: 'Schedule information'
            },
            location: {
              type: 'string',
              description: 'Location'
            },
            max_volunteers: {
              type: 'integer',
              description: 'Maximum number of volunteers'
            },
            current_volunteers: {
              type: 'integer',
              description: 'Current number of volunteers'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'full'],
              description: 'Option status'
            },
            image_url: {
              type: 'string',
              description: 'Option image URL'
            }
          }
        },
        VolunteerRegistration: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Registration ID'
            },
            user_id: {
              type: 'integer',
              description: 'User ID'
            },
            volunteer_option_id: {
              type: 'integer',
              description: 'Volunteer option ID'
            },
            status: {
              type: 'string',
              enum: ['registered', 'cancelled'],
              description: 'Registration status'
            },
            registration_date: {
              type: 'string',
              format: 'date-time',
              description: 'Registration date'
            },
            notes: {
              type: 'string',
              description: 'Registration notes'
            }
          }
        },
        VolunteerProposal: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Proposal ID'
            },
            user_id: {
              type: 'integer',
              description: 'User ID'
            },
            title: {
              type: 'string',
              description: 'Proposal title'
            },
            description: {
              type: 'string',
              description: 'Proposal description'
            },
            requirements: {
              type: 'string',
              description: 'Proposed requirements'
            },
            schedule: {
              type: 'string',
              description: 'Proposed schedule'
            },
            location: {
              type: 'string',
              description: 'Proposed location'
            },
            max_volunteers: {
              type: 'integer',
              description: 'Proposed max volunteers'
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              description: 'Proposal status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        DonationTicket: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Donation ticket ID'
            },
            donor_name: {
              type: 'string',
              description: 'Donor name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Donor email'
            },
            phone: {
              type: 'string',
              description: 'Donor phone'
            },
            amount: {
              type: 'number',
              description: 'Donation amount'
            },
            currency: {
              type: 'string',
              description: 'Currency code'
            },
            payment_method: {
              type: 'string',
              description: 'Payment method'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'cancelled'],
              description: 'Payment status'
            },
            payment_reference: {
              type: 'string',
              description: 'Payment reference'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Event ID'
            },
            title: {
              type: 'string',
              description: 'Event title'
            },
            description: {
              type: 'string',
              description: 'Event description'
            },
            event_date: {
              type: 'string',
              format: 'date',
              description: 'Event date'
            },
            event_time: {
              type: 'string',
              description: 'Event time'
            },
            location: {
              type: 'string',
              description: 'Event location'
            },
            image_url: {
              type: 'string',
              description: 'Event image URL'
            },
            status: {
              type: 'string',
              enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
              description: 'Event status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        LandingSection: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Section ID'
            },
            title: {
              type: 'string',
              description: 'Section title'
            },
            content: {
              type: 'string',
              description: 'Section content'
            },
            image_url: {
              type: 'string',
              description: 'Section image URL'
            },
            order: {
              type: 'integer',
              description: 'Display order'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether section is active'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {
      '/users/register': {
        post: {
          summary: 'Register a new user',
          tags: ['Users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'email', 'password', 'full_name'],
                  properties: {
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                    full_name: { type: 'string' },
                    phone: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/login': {
        post: {
          summary: 'User login',
          tags: ['Users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password'],
                  properties: {
                    username: { type: 'string', description: 'Username for login' },
                    password: { type: 'string', description: 'User password' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users': {
        get: {
          summary: 'Get all users (Admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of all users',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create new user (Admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'email', 'password', 'full_name'],
                  properties: {
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                    full_name: { type: 'string' },
                    phone: { type: 'string' },
                    role: { type: 'string', enum: ['admin', 'user'], default: 'user' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/{id}': {
        put: {
          summary: 'Update user by ID (Admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'User ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    full_name: { type: 'string' },
                    phone: { type: 'string' },
                    role: { type: 'string', enum: ['admin', 'user'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'User updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete user by ID (Admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'User ID'
            }
          ],
          responses: {
            '200': {
              description: 'User deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/verify-email': {
        post: {
          summary: 'Verify user email',
          tags: ['Users & Email'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token'],
                  properties: {
                    token: { type: 'string', description: 'Email verification token' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Email verified successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Invalid or expired token',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/resend-verification': {
        post: {
          summary: 'Resend email verification',
          tags: ['Users & Email'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Verification email sent successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Invalid email or user already verified',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/forgot-password': {
        post: {
          summary: 'Request password reset',
          tags: ['Users & Email'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Password reset email sent successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Invalid email',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '429': {
              description: 'Too many requests',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/reset-password': {
        post: {
          summary: 'Reset password with token',
          tags: ['Users & Email'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'newPassword'],
                  properties: {
                    token: { type: 'string', description: 'Password reset token' },
                    newPassword: { type: 'string', minLength: 6 }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Password reset successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Invalid or expired token',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/profile': {
        get: {
          summary: 'Get current user profile',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User profile retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update current user profile',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    full_name: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Profile updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/change-password': {
        post: {
          summary: 'Change user password',
          tags: ['Users & Email'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string' },
                    newPassword: { type: 'string', minLength: 6 }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Password changed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Invalid current password or validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/eligible-for-handover': {
        get: {
          summary: 'Get users eligible for handover (Admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of eligible users',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/assign-role': {
        post: {
          summary: 'Assign role to user (Admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId', 'role'],
                  properties: {
                    userId: { type: 'integer' },
                    role: { type: 'string', enum: ['admin', 'user'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Role assigned successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/remove-role': {
        post: {
          summary: 'Remove role from user (Admin only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId', 'role'],
                  properties: {
                    userId: { type: 'integer' },
                    role: { type: 'string', enum: ['admin', 'user'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Role removed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/google-drive/status': {
        get: {
          summary: 'Get Google Drive service status',
          tags: ['Google Drive'],
          responses: {
            '200': {
              description: 'Google Drive status retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      status: { type: 'object' }
                    }
                  }
                }
              }
            },
            '500': {
              description: 'Failed to get status',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/google-drive/initialize': {
        post: {
          summary: 'Initialize Google Drive service (Auth required)',
          tags: ['Google Drive'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Google Drive service initialized successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': {
              description: 'Failed to initialize Google Drive service',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/google-drive/refresh-token': {
        post: {
          summary: 'Refresh Google Drive token',
          tags: ['Google Drive'],
          responses: {
            '200': {
              description: 'Token refreshed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '500': {
              description: 'Failed to refresh token',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/google-drive/clear-tokens': {
        post: {
          summary: 'Clear existing Google Drive tokens',
          tags: ['Google Drive'],
          responses: {
            '200': {
              description: 'Tokens cleared successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '500': {
              description: 'Failed to clear tokens',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/google-drive/auth-url': {
        get: {
          summary: 'Get Google Drive authorization URL',
          tags: ['Google Drive'],
          responses: {
            '200': {
              description: 'Authorization URL generated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      authUrl: { type: 'string' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '500': {
              description: 'Failed to generate authorization URL',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/google-drive/auth/callback': {
        get: {
          summary: 'Google Drive OAuth callback',
          tags: ['Google Drive'],
          parameters: [
            {
              in: 'query',
              name: 'code',
              schema: { type: 'string' },
              description: 'Authorization code from Google'
            },
            {
              in: 'query',
              name: 'error',
              schema: { type: 'string' },
              description: 'Error message from Google'
            }
          ],
          responses: {
            '200': {
              description: 'Authorization successful',
              content: {
                'text/html': {
                  schema: { type: 'string' }
                }
              }
            },
            '400': {
              description: 'Authorization failed',
              content: {
                'text/html': {
                  schema: { type: 'string' }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'text/html': {
                  schema: { type: 'string' }
                }
              }
            }
          }
        }
      },
      '/users/google-drive/migrate-db': {
        post: {
          summary: 'Run database migration for Google Drive tokens',
          tags: ['Google Drive'],
          responses: {
            '200': {
              description: 'Database migration completed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '500': {
              description: 'Migration failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/users/google-drive/test': {
        post: {
          summary: 'Test Google Drive connection (Auth required)',
          tags: ['Google Drive'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Google Drive connection test successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      filesCount: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': {
              description: 'Google Drive connection test failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/workshops': {
        get: {
          summary: 'Get all workshops',
          tags: ['Workshops'],
          responses: {
            '200': {
              description: 'List of all workshops',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Workshop' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new workshop (Admin only)',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Workshop' }
              }
            }
          },
          responses: {
            '201': {
              description: 'Workshop created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Workshop' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/workshops/{id}': {
        get: {
          summary: 'Get workshop by ID',
          tags: ['Workshops'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Workshop ID'
            }
          ],
          responses: {
            '200': {
              description: 'Workshop details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Workshop' }
                }
              }
            },
            '404': {
              description: 'Workshop not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update workshop (Admin only)',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Workshop ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Workshop' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Workshop updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Workshop' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Workshop not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete workshop (Admin only)',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Workshop ID'
            }
          ],
          responses: {
            '200': {
              description: 'Workshop deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Workshop not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/workshops/enrollments': {
        get: {
          summary: 'Get all workshop enrollments (Admin only)',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'page',
              schema: { type: 'integer', default: 1 },
              description: 'Page number for pagination'
            },
            {
              in: 'query',
              name: 'limit',
              schema: { type: 'integer', default: 10 },
              description: 'Number of items per page'
            }
          ],
          responses: {
            '200': {
              description: 'List of all workshop enrollments with pagination',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      enrollments: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/WorkshopEnrollment' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          pages: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/workshops/enrollments/{id}/status': {
        put: {
          summary: 'Update workshop enrollment status (Admin only)',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Enrollment ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['enrolled', 'cancelled'],
                      description: 'New enrollment status'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Enrollment status updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Invalid status',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Enrollment not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/workshop-enrollments/available-spots/{workshop_id}': {
        get: {
          summary: 'Get available spots for a workshop',
          tags: ['Workshops'],
          parameters: [
            {
              in: 'path',
              name: 'workshop_id',
              required: true,
              schema: { type: 'integer' },
              description: 'Workshop ID'
            }
          ],
          responses: {
            '200': {
              description: 'Available spots information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      available_spots: { type: 'integer' },
                      total_spots: { type: 'integer' },
                      enrolled_count: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Invalid workshop ID',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Workshop not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/workshop-enrollments/register': {
        post: {
          summary: 'Register for a workshop',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['workshop_id'],
                  properties: {
                    workshop_id: { type: 'integer' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successfully enrolled in workshop',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      remaining_spots: { type: 'integer' },
                      workshop_title: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Validation error or no available spots',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/workshop-enrollments/cancel': {
        post: {
          summary: 'Cancel workshop enrollment',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['workshop_id'],
                  properties: {
                    workshop_id: { type: 'integer' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successfully cancelled workshop enrollment',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'User is not enrolled in this workshop',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/workshop-enrollments/my-enrollments': {
        get: {
          summary: 'Get current user\'s workshop enrollments',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of user\'s workshop enrollments',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/WorkshopEnrollment' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/workshop-enrollments/workshop/{workshop_id}': {
        get: {
          summary: 'Get enrollments for a specific workshop',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'workshop_id',
              required: true,
              schema: { type: 'integer' },
              description: 'Workshop ID'
            }
          ],
          responses: {
            '200': {
              description: 'List of enrollments for the workshop',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/WorkshopEnrollment' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/enrollments': {
        get: {
          summary: 'Get all enrollments (Admin only)',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of all enrollments',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/WorkshopEnrollment' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create new enrollment',
          tags: ['Workshops'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['workshop_id', 'user_id'],
                  properties: {
                    workshop_id: { type: 'integer' },
                    user_id: { type: 'integer' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Enrollment created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/WorkshopEnrollment' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/enrollments/workshop/{workshopId}': {
        get: {
          summary: 'Get enrollments by workshop (Admin only)',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'workshopId',
              required: true,
              schema: { type: 'integer' },
              description: 'Workshop ID'
            }
          ],
          responses: {
            '200': {
              description: 'List of enrollments for the workshop',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/WorkshopEnrollment' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/enrollments/{id}': {
        get: {
          summary: 'Get enrollment by ID (Admin only)',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Enrollment ID'
            }
          ],
          responses: {
            '200': {
              description: 'Enrollment details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/WorkshopEnrollment' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Enrollment not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update enrollment (Admin only)',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Enrollment ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['enrolled', 'cancelled']
                    },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Enrollment updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/WorkshopEnrollment' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Enrollment not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete enrollment (Admin only)',
          tags: ['Workshops'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Enrollment ID'
            }
          ],
          responses: {
            '200': {
              description: 'Enrollment deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Enrollment not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/records': {
        get: {
          summary: 'Get attendance records',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'activity_track_id',
              schema: { type: 'integer' },
              description: 'Filter by activity track ID'
            },
            {
              in: 'query',
              name: 'beneficiario_id',
              schema: { type: 'integer' },
              description: 'Filter by beneficiary ID'
            },
            {
              in: 'query',
              name: 'date_from',
              schema: { type: 'string', format: 'date' },
              description: 'Filter from date'
            },
            {
              in: 'query',
              name: 'date_to',
              schema: { type: 'string', format: 'date' },
              description: 'Filter to date'
            }
          ],
          responses: {
            '200': {
              description: 'List of attendance records',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AttendanceRecord' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create manual attendance record',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['activity_track_id', 'beneficiario_id'],
                  properties: {
                    activity_track_id: { type: 'integer' },
                    beneficiario_id: { type: 'integer' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Attendance record created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AttendanceRecord' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/records/{id}': {
        get: {
          summary: 'Get attendance record by ID',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Attendance record ID'
            }
          ],
          responses: {
            '200': {
              description: 'Attendance record details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AttendanceRecord' }
                }
              }
            },
            '404': {
              description: 'Attendance record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update attendance record',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Attendance record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    attendance_date: { type: 'string', format: 'date-time' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Attendance record updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AttendanceRecord' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Attendance record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete attendance record',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Attendance record ID'
            }
          ],
          responses: {
            '200': {
              description: 'Attendance record deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Attendance record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-tracks': {
        get: {
          summary: 'Get all activity tracks',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'page',
              schema: { type: 'integer', default: 1 },
              description: 'Page number for pagination'
            },
            {
              in: 'query',
              name: 'limit',
              schema: { type: 'integer', default: 10 },
              description: 'Items per page'
            }
          ],
          responses: {
            '200': {
              description: 'List of activity tracks',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ActivityTrack' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create new activity track',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'description', 'start_date', 'end_date'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    start_date: { type: 'string', format: 'date' },
                    end_date: { type: 'string', format: 'date' },
                    status: { type: 'string', enum: ['active', 'inactive', 'completed'] }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Activity track created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ActivityTrack' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-tracks/upcoming': {
        get: {
          summary: 'Get upcoming activity tracks',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of upcoming activity tracks',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ActivityTrack' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-tracks/date-range': {
        get: {
          summary: 'Get activity tracks by date range',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'start_date',
              required: true,
              schema: { type: 'string', format: 'date' },
              description: 'Start date (YYYY-MM-DD)'
            },
            {
              in: 'query',
              name: 'end_date',
              required: true,
              schema: { type: 'string', format: 'date' },
              description: 'End date (YYYY-MM-DD)'
            }
          ],
          responses: {
            '200': {
              description: 'List of activity tracks in date range',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ActivityTrack' }
                  }
                }
              }
            },
            '400': {
              description: 'Invalid date range',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-tracks/active-scanning': {
        get: {
          summary: 'Get currently active scanning activity track',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Currently active scanning activity track',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ActivityTrack' }
                }
              }
            },
            '404': {
              description: 'No active scanning activity track',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-tracks/{id}': {
        get: {
          summary: 'Get activity track by ID',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            }
          ],
          responses: {
            '200': {
              description: 'Activity track details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ActivityTrack' }
                }
              }
            },
            '404': {
              description: 'Activity track not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update activity track',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    start_date: { type: 'string', format: 'date' },
                    end_date: { type: 'string', format: 'date' },
                    status: { type: 'string', enum: ['active', 'inactive', 'completed'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Activity track updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ActivityTrack' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Activity track not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete activity track',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            }
          ],
          responses: {
            '200': {
              description: 'Activity track deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Activity track not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-tracks/{id}/start-scanning': {
        put: {
          summary: 'Start QR scanning for activity track',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            }
          ],
          responses: {
            '200': {
              description: 'QR scanning started successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Cannot start scanning',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Activity track not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-tracks/{id}/stop-scanning': {
        put: {
          summary: 'Stop QR scanning for activity track',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            }
          ],
          responses: {
            '200': {
              description: 'QR scanning stopped successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Activity track not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-tracks/{id}/attendance': {
        get: {
          summary: 'Get activity track with attendance records',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            }
          ],
          responses: {
            '200': {
              description: 'Activity track with attendance records',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    allOf: [
                      { $ref: '#/components/schemas/ActivityTrack' },
                      {
                        type: 'object',
                        properties: {
                          attendance_records: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AttendanceRecord' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '404': {
              description: 'Activity track not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/analytics/overview': {
        get: {
          summary: 'Get comprehensive attendance analytics overview',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Attendance analytics overview',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AttendanceAnalytics' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/analytics/insights': {
        get: {
          summary: 'Get attendance patterns and insights',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'period',
              schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] },
              description: 'Analysis period'
            }
          ],
          responses: {
            '200': {
              description: 'Attendance insights and patterns',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      patterns: { type: 'array' },
                      trends: { type: 'array' },
                      recommendations: { type: 'array' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/analytics/export': {
        get: {
          summary: 'Export attendance data',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'format',
              schema: { type: 'string', enum: ['csv', 'excel', 'pdf'] },
              description: 'Export format'
            },
            {
              in: 'query',
              name: 'start_date',
              schema: { type: 'string', format: 'date' },
              description: 'Start date for export'
            },
            {
              in: 'query',
              name: 'end_date',
              schema: { type: 'string', format: 'date' },
              description: 'End date for export'
            }
          ],
          responses: {
            '200': {
              description: 'Attendance data exported successfully',
              content: {
                'application/octet-stream': {
                  schema: {
                    type: 'string',
                    format: 'binary'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/analytics/activity/{activityTrackId}/report': {
        get: {
          summary: 'Get detailed activity report',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'activityTrackId',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            }
          ],
          responses: {
            '200': {
              description: 'Detailed activity report',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      activity_info: { $ref: '#/components/schemas/ActivityTrack' },
                      attendance_summary: { type: 'object' },
                      attendance_list: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AttendanceRecord' }
                      },
                      statistics: { type: 'object' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Activity track not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/analytics/activity/comparison': {
        get: {
          summary: 'Compare multiple activities',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'activity_ids',
              required: true,
              schema: {
                type: 'array',
                items: { type: 'integer' }
              },
              description: 'Array of activity track IDs to compare'
            }
          ],
          responses: {
            '200': {
              description: 'Activity comparison report',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      comparison_data: { type: 'array' },
                      summary: { type: 'object' },
                      charts_data: { type: 'object' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Invalid activity IDs',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/reports/activity/{activityTrackId}': {
        get: {
          summary: 'Generate activity report (Legacy endpoint)',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'activityTrackId',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            }
          ],
          responses: {
            '200': {
              description: 'Activity report generated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      activityTrackId: { type: 'integer' },
                      features: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Invalid activity track ID',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/qr-scan': {
        post: {
          summary: 'Process QR code scan for attendance',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['qrData', 'activityTrackId'],
                  properties: {
                    qrData: { type: 'string', description: 'QR code data' },
                    activityTrackId: { type: 'integer', description: 'Activity track ID' },
                    notes: { type: 'string', description: 'Additional notes' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'QR scan processed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AttendanceRecord' }
                }
              }
            },
            '400': {
              description: 'Invalid QR data or activity track',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/manual': {
        post: {
          summary: 'Create manual attendance entry',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['activityTrackId', 'beneficiarioId'],
                  properties: {
                    activityTrackId: { type: 'integer', description: 'Activity track ID' },
                    beneficiarioId: { type: 'integer', description: 'Beneficiario ID' },
                    notes: { type: 'string', description: 'Manual entry notes' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Manual attendance entry created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AttendanceRecord' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/recent': {
        get: {
          summary: 'Get recent attendance records',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'limit',
              schema: { type: 'integer', default: 10 },
              description: 'Number of recent records to retrieve'
            },
            {
              in: 'query',
              name: 'activityTrackId',
              schema: { type: 'integer' },
              description: 'Filter by activity track ID'
            }
          ],
          responses: {
            '200': {
              description: 'Recent attendance records retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AttendanceRecord' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/stats/date-range': {
        get: {
          summary: 'Get attendance statistics by date range',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'start_date',
              required: true,
              schema: { type: 'string', format: 'date' },
              description: 'Start date (YYYY-MM-DD)'
            },
            {
              in: 'query',
              name: 'end_date',
              required: true,
              schema: { type: 'string', format: 'date' },
              description: 'End date (YYYY-MM-DD)'
            },
            {
              in: 'query',
              name: 'activityTrackId',
              schema: { type: 'integer' },
              description: 'Filter by activity track ID'
            }
          ],
          responses: {
            '200': {
              description: 'Attendance statistics by date range',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total_attendance: { type: 'integer' },
                      qr_scans: { type: 'integer' },
                      manual_entries: { type: 'integer' },
                      beneficiaries: { type: 'integer' },
                      guests: { type: 'integer' },
                      date_range: {
                        type: 'object',
                        properties: {
                          start_date: { type: 'string', format: 'date' },
                          end_date: { type: 'string', format: 'date' }
                        }
                      },
                      daily_breakdown: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: { type: 'string', format: 'date' },
                            attendance_count: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Invalid date range',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-track/{activityTrackId}': {
        get: {
          summary: 'Get attendance records for specific activity track',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'activityTrackId',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            },
            {
              in: 'query',
              name: 'page',
              schema: { type: 'integer', default: 1 },
              description: 'Page number for pagination'
            },
            {
              in: 'query',
              name: 'limit',
              schema: { type: 'integer', default: 10 },
              description: 'Items per page'
            }
          ],
          responses: {
            '200': {
              description: 'Attendance records for activity track',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      records: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AttendanceRecord' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          pages: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Activity track not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-track/{activityTrackId}/stats': {
        get: {
          summary: 'Get attendance statistics for specific activity track',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'activityTrackId',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            }
          ],
          responses: {
            '200': {
              description: 'Attendance statistics for activity track',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      activity_track_id: { type: 'integer' },
                      total_attendance: { type: 'integer' },
                      qr_scans: { type: 'integer' },
                      manual_entries: { type: 'integer' },
                      beneficiaries: { type: 'integer' },
                      guests: { type: 'integer' },
                      attendance_rate: { type: 'number', format: 'float' },
                      peak_attendance_time: { type: 'string' },
                      last_attendance: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Activity track not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-track/{activityTrackId}/check/{recordId}': {
        get: {
          summary: 'Check if beneficiario has attended activity track',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'activityTrackId',
              required: true,
              schema: { type: 'integer' },
              description: 'Activity track ID'
            },
            {
              in: 'path',
              name: 'recordId',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID to check'
            }
          ],
          responses: {
            '200': {
              description: 'Attendance check result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      has_attended: { type: 'boolean' },
                      attendance_record: { $ref: '#/components/schemas/AttendanceRecord' },
                      attendance_type: { type: 'string', enum: ['qr_scan', 'manual'] },
                      attendance_date: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Activity track or record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/attendance/test': {
        get: {
          summary: 'Test attendance module connectivity',
          tags: ['Attendance'],
          responses: {
            '200': {
              description: 'Attendance module test successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      endpoints: {
                        type: 'object',
                        properties: {
                          activityTracks: { type: 'string' },
                          attendanceRecords: { type: 'string' },
                          analytics: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/attendance/activity-tracks/test': {
        get: {
          summary: 'Test activity tracks module connectivity',
          tags: ['Attendance'],
          responses: {
            '200': {
              description: 'Activity tracks module test successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/attendance/analytics/test': {
        get: {
          summary: 'Test analytics module connectivity',
          tags: ['Attendance'],
          responses: {
            '200': {
              description: 'Analytics module test successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/volunteers': {
        get: {
          summary: 'Get all volunteer forms',
          tags: ['Volunteers'],
          parameters: [
            {
              in: 'query',
              name: 'status',
              schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
              description: 'Filter by status'
            },
            {
              in: 'query',
              name: 'page',
              schema: { type: 'integer', default: 1 },
              description: 'Page number'
            },
            {
              in: 'query',
              name: 'limit',
              schema: { type: 'integer', default: 10 },
              description: 'Items per page'
            }
          ],
          responses: {
            '200': {
              description: 'List of volunteer forms',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/VolunteerForm' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Submit volunteer application',
          tags: ['Volunteers'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['full_name', 'email', 'phone', 'availability', 'skills'],
                  properties: {
                    full_name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    availability: { type: 'string' },
                    skills: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    experience: { type: 'string' },
                    motivation: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Volunteer application submitted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/VolunteerForm' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteers/me': {
        get: {
          summary: 'Get current user\'s volunteer enrollments',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User\'s volunteer enrollments retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/VolunteerForm' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteers/enroll/{optionId}': {
        post: {
          summary: 'Enroll current user into volunteer option',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'optionId',
              required: true,
              schema: { type: 'integer' },
              description: 'Volunteer option ID'
            }
          ],
          responses: {
            '200': {
              description: 'Successfully enrolled in volunteer option',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Validation error or already enrolled',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Volunteer option not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteers/unenroll/{volunteerId}': {
        delete: {
          summary: 'Unenroll current user from volunteer option',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'volunteerId',
              required: true,
              schema: { type: 'integer' },
              description: 'Volunteer ID'
            }
          ],
          responses: {
            '200': {
              description: 'Successfully unenrolled from volunteer option',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'User is not enrolled in this volunteer option',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Volunteer enrollment not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteers/{id}': {
        get: {
          summary: 'Get volunteer form by ID',
          tags: ['Volunteers'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Volunteer form ID'
            }
          ],
          responses: {
            '200': {
              description: 'Volunteer form details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/VolunteerForm' }
                }
              }
            },
            '404': {
              description: 'Volunteer form not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update volunteer form (Admin only)',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Volunteer form ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['pending', 'approved', 'rejected']
                    },
                    full_name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    availability: { type: 'string' },
                    skills: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    experience: { type: 'string' },
                    motivation: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Volunteer form updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/VolunteerForm' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Volunteer form not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete volunteer form (Admin only)',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Volunteer form ID'
            }
          ],
          responses: {
            '200': {
              description: 'Volunteer form deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Volunteer form not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-options': {
        get: {
          summary: 'Get all volunteer options',
          tags: ['Volunteers'],
          responses: {
            '200': {
              description: 'List of volunteer options',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/VolunteerOption' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Add new volunteer option (Admin only)',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'requirements'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    requirements: { type: 'string' },
                    schedule: { type: 'string' },
                    location: { type: 'string' },
                    max_volunteers: { type: 'integer' },
                    image: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Volunteer option created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/VolunteerOption' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-options/{id}': {
        put: {
          summary: 'Update volunteer option (Admin only)',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Volunteer option ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    requirements: { type: 'string' },
                    schedule: { type: 'string' },
                    location: { type: 'string' },
                    max_volunteers: { type: 'integer' },
                    image: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Volunteer option updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/VolunteerOption' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Volunteer option not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete volunteer option (Admin only)',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Volunteer option ID'
            }
          ],
          responses: {
            '200': {
              description: 'Volunteer option deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Volunteer option not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-options/proposals': {
        post: {
          summary: 'Submit volunteer option proposal',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'requirements'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    requirements: { type: 'string' },
                    schedule: { type: 'string' },
                    location: { type: 'string' },
                    max_volunteers: { type: 'integer' },
                    document: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Proposal submitted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/VolunteerProposal' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        get: {
          summary: 'Get all volunteer proposals (Admin only)',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of all volunteer proposals',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/VolunteerProposal' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-options/proposals/mine': {
        get: {
          summary: 'Get current user\'s volunteer proposals',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of user\'s volunteer proposals',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/VolunteerProposal' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-options/proposals/{id}/status': {
        post: {
          summary: 'Set proposal status (Admin only)',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Proposal ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['pending', 'approved', 'rejected'],
                      description: 'New proposal status'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Proposal status updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/VolunteerProposal' }
                }
              }
            },
            '400': {
              description: 'Invalid status',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Proposal not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-options/proposals/{id}': {
        delete: {
          summary: 'Delete own proposal',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Proposal ID'
            }
          ],
          responses: {
            '200': {
              description: 'Proposal deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Proposal not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-registrations/register': {
        post: {
          summary: 'Register for volunteer option',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['volunteer_option_id'],
                  properties: {
                    volunteer_option_id: { type: 'integer' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successfully registered for volunteer option',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Validation error or no available spots',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-registrations/cancel': {
        post: {
          summary: 'Cancel volunteer registration',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['volunteer_option_id'],
                  properties: {
                    volunteer_option_id: { type: 'integer' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successfully cancelled volunteer registration',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'User is not registered for this volunteer option',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-registrations/my-registrations': {
        get: {
          summary: 'Get current user\'s volunteer registrations',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of user\'s volunteer registrations',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/VolunteerRegistration' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-registrations/volunteer-option/{volunteer_option_id}': {
        get: {
          summary: 'Get registrations for specific volunteer option (Admin only)',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'volunteer_option_id',
              required: true,
              schema: { type: 'integer' },
              description: 'Volunteer option ID'
            }
          ],
          responses: {
            '200': {
              description: 'List of registrations for the volunteer option',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/VolunteerRegistration' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/volunteer-registrations/available-spots/{volunteer_option_id}': {
        get: {
          summary: 'Get available spots for volunteer option',
          tags: ['Volunteers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'volunteer_option_id',
              required: true,
              schema: { type: 'integer' },
              description: 'Volunteer option ID'
            }
          ],
          responses: {
            '200': {
              description: 'Available spots information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      available_spots: { type: 'integer' },
                      total_spots: { type: 'integer' },
                      registered_count: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records': {
        get: {
          summary: 'Get all records',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'status',
              schema: { type: 'string', enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'] },
              description: 'Filter by status'
            },
            {
              in: 'query',
              name: 'phase',
              schema: { type: 'string', enum: ['phase1', 'phase2', 'phase3', 'completed'] },
              description: 'Filter by phase'
            }
          ],
          responses: {
            '200': {
              description: 'List of records',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Record' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new record',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['cedula', 'full_name'],
                  properties: {
                    cedula: { type: 'string' },
                    full_name: { type: 'string' },
                    birth_date: { type: 'string', format: 'date' },
                    gender: { type: 'string', enum: ['M', 'F'] },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Record created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/admin-direct': {
        post: {
          summary: 'Create admin direct record (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['cedula', 'full_name'],
                  properties: {
                    cedula: { type: 'string' },
                    full_name: { type: 'string' },
                    birth_date: { type: 'string', format: 'date' },
                    gender: { type: 'string', enum: ['M', 'F'] },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    documents: { type: 'string', format: 'binary', description: 'Record documents' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Admin direct record created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/my-record': {
        get: {
          summary: 'Get current user\'s record',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User\'s record retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '404': {
              description: 'User has no record',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/stats': {
        get: {
          summary: 'Get record statistics (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Record statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total_records: { type: 'integer' },
                      records_by_status: { type: 'object' },
                      records_by_phase: { type: 'object' },
                      recent_activity: { type: 'array' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/search/cedula/{cedula}': {
        get: {
          summary: 'Search record by cedula (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'cedula',
              required: true,
              schema: { type: 'string' },
              description: 'Cedula number'
            }
          ],
          responses: {
            '200': {
              description: 'Record found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/check-cedula/{cedula}': {
        get: {
          summary: 'Check if cedula exists (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'cedula',
              required: true,
              schema: { type: 'string' },
              description: 'Cedula number to check'
            }
          ],
          responses: {
            '200': {
              description: 'Cedula check result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      exists: { type: 'boolean' },
                      record_id: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/check-cedula-availability/{cedula}': {
        get: {
          summary: 'Check cedula availability (Public)',
          tags: ['Records'],
          parameters: [
            {
              in: 'path',
              name: 'cedula',
              required: true,
              schema: { type: 'string' },
              description: 'Cedula number to check'
            }
          ],
          responses: {
            '200': {
              description: 'Cedula availability check result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      available: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/records/{id}/admin-edit': {
        put: {
          summary: 'Update record as admin (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    cedula: { type: 'string' },
                    full_name: { type: 'string' },
                    birth_date: { type: 'string', format: 'date' },
                    gender: { type: 'string', enum: ['M', 'F'] },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    status: { type: 'string', enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'] },
                    documents: { type: 'string', format: 'binary', description: 'Record documents' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Record updated successfully by admin',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/handover': {
        put: {
          summary: 'Hand over admin-created record to user (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['user_id'],
                  properties: {
                    user_id: { type: 'integer', description: 'User ID to hand over the record to' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Record handed over successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Invalid user ID or record already owned',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record or user not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/geographic-analytics': {
        get: {
          summary: 'Get geographic analytics (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Geographic analytics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      records_by_province: { type: 'object' },
                      records_by_canton: { type: 'object' },
                      records_by_district: { type: 'object' },
                      geographic_distribution: { type: 'array' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/disability-analytics': {
        get: {
          summary: 'Get disability analytics (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Disability analytics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      disability_types: { type: 'object' },
                      severity_distribution: { type: 'object' },
                      age_groups: { type: 'object' },
                      gender_distribution: { type: 'object' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/family-analytics': {
        get: {
          summary: 'Get family analytics (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Family analytics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      family_size_distribution: { type: 'object' },
                      dependents_by_age: { type: 'object' },
                      family_income_distribution: { type: 'object' },
                      family_structure: { type: 'object' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}': {
        get: {
          summary: 'Get record by ID',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          responses: {
            '200': {
              description: 'Record details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update record',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cedula: { type: 'string' },
                    full_name: { type: 'string' },
                    birth_date: { type: 'string', format: 'date' },
                    gender: { type: 'string', enum: ['M', 'F'] },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    status: { type: 'string', enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Record updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete record',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          responses: {
            '200': {
              description: 'Record deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/complete': {
        put: {
          summary: 'Complete record with documents',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    documents: { type: 'string', format: 'binary', description: 'Record documents' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Record completed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/status': {
        patch: {
          summary: 'Update record status',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { type: 'string', enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Record status updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '400': {
              description: 'Invalid status',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/approve-phase1': {
        put: {
          summary: 'Approve Phase 1 (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          responses: {
            '200': {
              description: 'Phase 1 approved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Phase 1 cannot be approved',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/reject-phase1': {
        put: {
          summary: 'Reject Phase 1 (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['reason'],
                  properties: {
                    reason: { type: 'string', description: 'Rejection reason' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Phase 1 rejected successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Phase 1 cannot be rejected',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/request-modification': {
        put: {
          summary: 'Request Phase 1 modification (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['reason'],
                  properties: {
                    reason: { type: 'string', description: 'Modification request reason' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Modification request sent successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Cannot request modification',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/request-phase3-modification': {
        put: {
          summary: 'Request Phase 3 modification (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['reason'],
                  properties: {
                    reason: { type: 'string', description: 'Phase 3 modification request reason' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Phase 3 modification request sent successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Cannot request Phase 3 modification',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/update-phase1': {
        put: {
          summary: 'Update Phase 1 data',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Record' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Phase 1 data updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/update-phase3': {
        put: {
          summary: 'Update Phase 3 data with documents',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    documents: { type: 'string', format: 'binary', description: 'Phase 3 documents' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Phase 3 data updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Record' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/approve': {
        put: {
          summary: 'Approve complete record (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          responses: {
            '200': {
              description: 'Record approved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Record cannot be approved',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/records/{id}/reject': {
        put: {
          summary: 'Reject complete record (Admin only)',
          tags: ['Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Record ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['reason'],
                  properties: {
                    reason: { type: 'string', description: 'Rejection reason' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Record rejected successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '400': {
              description: 'Record cannot be rejected',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/donations': {
        get: {
          summary: 'Get all donations',
          tags: ['Donations'],
          parameters: [
            {
              in: 'query',
              name: 'status',
              schema: { type: 'string', enum: ['pending', 'completed', 'failed', 'cancelled'] },
              description: 'Filter by status'
            }
          ],
          responses: {
            '200': {
              description: 'List of donations',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/DonationTicket' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create donation ticket',
          tags: ['Donations'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['donor_name', 'amount', 'currency', 'payment_method'],
                  properties: {
                    donor_name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    amount: { type: 'number' },
                    currency: { type: 'string' },
                    payment_method: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Donation ticket created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DonationTicket' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/donations/{id}': {
        get: {
          summary: 'Get donation by ID',
          tags: ['Donations'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation ID'
            }
          ],
          responses: {
            '200': {
              description: 'Donation details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DonationTicket' }
                }
              }
            },
            '404': {
              description: 'Donation not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete donation (Admin only)',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation ID'
            }
          ],
          responses: {
            '200': {
              description: 'Donation deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Donation not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/donation-tickets': {
        get: {
          summary: 'Get all donation tickets (Admin only)',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Donation tickets retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/DonationTicket' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create donation ticket (Public)',
          tags: ['Donations'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount', 'currency', 'donor_name', 'donor_email'],
                  properties: {
                    amount: { type: 'number', description: 'Donation amount' },
                    currency: { type: 'string', enum: ['USD', 'CRC'], description: 'Currency type' },
                    donor_name: { type: 'string', description: 'Donor name' },
                    donor_email: { type: 'string', format: 'email', description: 'Donor email' },
                    donor_phone: { type: 'string', description: 'Donor phone number' },
                    message: { type: 'string', description: 'Optional donation message' },
                    anonymous: { type: 'boolean', description: 'Whether donation is anonymous' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Donation ticket created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DonationTicket' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/donation-tickets/user/{userId}': {
        get: {
          summary: 'Get donation tickets by user ID',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'userId',
              required: true,
              schema: { type: 'integer' },
              description: 'User ID'
            }
          ],
          responses: {
            '200': {
              description: 'User donation tickets retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/DonationTicket' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/donation-tickets/{id}': {
        get: {
          summary: 'Get donation ticket by ID',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation ticket ID'
            }
          ],
          responses: {
            '200': {
              description: 'Donation ticket details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DonationTicket' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Donation ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update donation ticket',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation ticket ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DonationTicket' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Donation ticket updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DonationTicket' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Donation ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/donation-tickets/{id}/close': {
        patch: {
          summary: 'Close donation ticket',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation ticket ID'
            }
          ],
          responses: {
            '200': {
              description: 'Donation ticket closed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Donation ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/donation-tickets/{id}/archive': {
        patch: {
          summary: 'Archive donation ticket',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation ticket ID'
            }
          ],
          responses: {
            '200': {
              description: 'Donation ticket archived successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Donation ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/anonymous-tickets': {
        get: {
          summary: 'Get all anonymous tickets (Admin only)',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Anonymous tickets retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AnonymousTicket' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create anonymous ticket (Public)',
          tags: ['Donations'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['subject', 'message', 'contact_email'],
                  properties: {
                    subject: { type: 'string', description: 'Ticket subject' },
                    message: { type: 'string', description: 'Ticket message' },
                    contact_email: { type: 'string', format: 'email', description: 'Contact email' },
                    contact_name: { type: 'string', description: 'Contact name' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Ticket priority' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Anonymous ticket created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AnonymousTicket' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/anonymous-tickets/{ticketId}': {
        get: {
          summary: 'Get anonymous ticket by ticket ID (Public)',
          tags: ['Donations'],
          parameters: [
            {
              in: 'path',
              name: 'ticketId',
              required: true,
              schema: { type: 'string' },
              description: 'Anonymous ticket ID'
            }
          ],
          responses: {
            '200': {
              description: 'Anonymous ticket details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AnonymousTicket' }
                }
              }
            },
            '404': {
              description: 'Anonymous ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/anonymous-tickets/{ticketId}/messages': {
        get: {
          summary: 'Get messages for anonymous ticket (Public)',
          tags: ['Donations'],
          parameters: [
            {
              in: 'path',
              name: 'ticketId',
              required: true,
              schema: { type: 'string' },
              description: 'Anonymous ticket ID'
            }
          ],
          responses: {
            '200': {
              description: 'Ticket messages retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TicketMessage' }
                  }
                }
              }
            },
            '404': {
              description: 'Anonymous ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Send message to anonymous ticket (Public)',
          tags: ['Donations'],
          parameters: [
            {
              in: 'path',
              name: 'ticketId',
              required: true,
              schema: { type: 'string' },
              description: 'Anonymous ticket ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message', 'sender_type'],
                  properties: {
                    message: { type: 'string', description: 'Message content' },
                    sender_type: { type: 'string', enum: ['user', 'admin'], description: 'Message sender type' },
                    sender_name: { type: 'string', description: 'Sender name' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Message sent successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TicketMessage' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Anonymous ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/anonymous-tickets/id/{id}': {
        get: {
          summary: 'Get anonymous ticket by internal ID (Admin only)',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Anonymous ticket internal ID'
            }
          ],
          responses: {
            '200': {
              description: 'Anonymous ticket details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AnonymousTicket' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Anonymous ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/anonymous-tickets/{id}': {
        put: {
          summary: 'Update anonymous ticket (Admin only)',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Anonymous ticket ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AnonymousTicket' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Anonymous ticket updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AnonymousTicket' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Anonymous ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/anonymous-tickets/{id}/close': {
        patch: {
          summary: 'Close anonymous ticket (Admin only)',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Anonymous ticket ID'
            }
          ],
          responses: {
            '200': {
              description: 'Anonymous ticket closed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Anonymous ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/anonymous-tickets/{id}/archive': {
        patch: {
          summary: 'Archive anonymous ticket (Admin only)',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Anonymous ticket ID'
            }
          ],
          responses: {
            '200': {
              description: 'Anonymous ticket archived successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Anonymous ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/ticket-messages': {
        get: {
          summary: 'Get all ticket messages (Admin only)',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Ticket messages retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TicketMessage' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create ticket message (Public)',
          tags: ['Donations'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message', 'ticket_id', 'sender_type'],
                  properties: {
                    message: { type: 'string', description: 'Message content' },
                    ticket_id: { type: 'string', description: 'Ticket ID' },
                    sender_type: { type: 'string', enum: ['user', 'admin'], description: 'Sender type' },
                    sender_name: { type: 'string', description: 'Sender name' },
                    sender_email: { type: 'string', format: 'email', description: 'Sender email' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Ticket message created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TicketMessage' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/ticket-messages/ticket/{ticketId}': {
        get: {
          summary: 'Get messages by ticket ID',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'ticketId',
              required: true,
              schema: { type: 'string' },
              description: 'Ticket ID'
            }
          ],
          responses: {
            '200': {
              description: 'Ticket messages retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TicketMessage' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/ticket-messages/donation/{ticketId}': {
        get: {
          summary: 'Get messages by donation ticket ID',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'ticketId',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation ticket ID'
            }
          ],
          responses: {
            '200': {
              description: 'Donation ticket messages retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TicketMessage' }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Donation ticket not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/ticket-messages/{id}': {
        delete: {
          summary: 'Delete ticket message',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Ticket message ID'
            }
          ],
          responses: {
            '200': {
              description: 'Ticket message deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Ticket message not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/events': {
        get: {
          summary: 'Get all events',
          tags: ['Events'],
          parameters: [
            {
              in: 'query',
              name: 'status',
              schema: { type: 'string', enum: ['upcoming', 'ongoing', 'completed', 'cancelled'] },
              description: 'Filter by status'
            }
          ],
          responses: {
            '200': {
              description: 'List of events',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Event' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create new event (Admin only)',
          tags: ['Events'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'event_date', 'location'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    event_date: { type: 'string', format: 'date' },
                    event_time: { type: 'string' },
                    location: { type: 'string' },
                    image_url: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Event created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Event' }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/hero-section': {
        get: {
          summary: 'Get all hero sections',
          tags: ['Landing'],
          responses: {
            '200': {
              description: 'List of hero sections',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LandingSection' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create hero section (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    image_url: { type: 'string' },
                    order: { type: 'integer' },
                    is_active: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Hero section created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/hero-section/{id}': {
        get: {
          summary: 'Get hero section by ID',
          tags: ['Landing'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Hero section ID'
            }
          ],
          responses: {
            '200': {
              description: 'Hero section details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '404': {
              description: 'Hero section not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update hero section (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Hero section ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    image_url: { type: 'string' },
                    order: { type: 'integer' },
                    is_active: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Hero section updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Hero section not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete hero section (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Hero section ID'
            }
          ],
          responses: {
            '200': {
              description: 'Hero section deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Hero section not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/about-section': {
        get: {
          summary: 'Get all about sections',
          tags: ['Landing'],
          responses: {
            '200': {
              description: 'List of about sections',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LandingSection' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create about section (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    image_url: { type: 'string' },
                    order: { type: 'integer' },
                    is_active: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'About section created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/about-section/{id}': {
        get: {
          summary: 'Get about section by ID',
          tags: ['Landing'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'About section ID'
            }
          ],
          responses: {
            '200': {
              description: 'About section details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '404': {
              description: 'About section not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update about section (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'About section ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    image_url: { type: 'string' },
                    order: { type: 'integer' },
                    is_active: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'About section updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'About section not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete about section (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'About section ID'
            }
          ],
          responses: {
            '200': {
              description: 'About section deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'About section not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/landing-volunteer': {
        get: {
          summary: 'Get all landing volunteer sections',
          tags: ['Landing'],
          responses: {
            '200': {
              description: 'List of landing volunteer sections',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LandingSection' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create landing volunteer section (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    image_url: { type: 'string' },
                    order: { type: 'integer' },
                    is_active: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Landing volunteer section created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/landing-volunteer/{id}': {
        get: {
          summary: 'Get landing volunteer section by ID',
          tags: ['Landing'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Landing volunteer section ID'
            }
          ],
          responses: {
            '200': {
              description: 'Landing volunteer section details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '404': {
              description: 'Landing volunteer section not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update landing volunteer section (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Landing volunteer section ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    image_url: { type: 'string' },
                    order: { type: 'integer' },
                    is_active: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Landing volunteer section updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Landing volunteer section not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete landing volunteer section (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Landing volunteer section ID'
            }
          ],
          responses: {
            '200': {
              description: 'Landing volunteer section deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Landing volunteer section not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/landing-donaciones-card': {
        get: {
          summary: 'Get all donation cards',
          tags: ['Landing'],
          responses: {
            '200': {
              description: 'List of donation cards',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LandingSection' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create donation card (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    imagen: { type: 'string', format: 'binary' },
                    order: { type: 'integer' },
                    is_active: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Donation card created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/landing-donaciones-card/{id}': {
        get: {
          summary: 'Get donation card by ID',
          tags: ['Landing'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation card ID'
            }
          ],
          responses: {
            '200': {
              description: 'Donation card details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '404': {
              description: 'Donation card not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update donation card (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation card ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    imagen: { type: 'string', format: 'binary' },
                    order: { type: 'integer' },
                    is_active: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Donation card updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Donation card not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete donation card (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation card ID'
            }
          ],
          responses: {
            '200': {
              description: 'Donation card deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Donation card not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/landing-donaciones-component': {
        get: {
          summary: 'Get all donation components',
          tags: ['Landing'],
          responses: {
            '200': {
              description: 'List of donation components',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LandingSection' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create donation component (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    image_url: { type: 'string' },
                    order: { type: 'integer' },
                    is_active: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Donation component created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/landing-donaciones-component/{id}': {
        get: {
          summary: 'Get donation component by ID',
          tags: ['Landing'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation component ID'
            }
          ],
          responses: {
            '200': {
              description: 'Donation component details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '404': {
              description: 'Donation component not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update donation component (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation component ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    image_url: { type: 'string' },
                    order: { type: 'integer' },
                    is_active: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Donation component updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LandingSection' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Donation component not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete donation component (Admin only)',
          tags: ['Landing'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Donation component ID'
            }
          ],
          responses: {
            '200': {
              description: 'Donation component deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Donation component not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/upload/image': {
        post: {
          summary: 'Upload image file',
          tags: ['Upload'],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['image'],
                  properties: {
                    image: {
                      type: 'string',
                      format: 'binary',
                      description: 'Image file to upload'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Image uploaded successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      url: {
                        type: 'string',
                        description: 'URL of the uploaded image'
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'No file uploaded',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': {
              description: 'Upload failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './src/modules/**/*.ts',
    './src/routes/**/*.ts',
    './src/controllers/**/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Swagger UI setup with dark mode
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ASONIPED Digital API Documentation'
  }));

  // JSON endpoint for the swagger spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Get the public URL - prioritize BACKEND_URL, then Railway auto-generated variables
  const getSwaggerUrl = () => {
    // User-defined BACKEND_URL (highest priority)
    if (process.env.BACKEND_URL) {
      return process.env.BACKEND_URL.startsWith('http') 
        ? process.env.BACKEND_URL 
        : `https://${process.env.BACKEND_URL}`;
    }
    // User-defined API_URL
    if (process.env.API_URL) {
      return process.env.API_URL.startsWith('http') 
        ? process.env.API_URL 
        : `https://${process.env.API_URL}`;
    }
    // Railway auto-generated variables
    if (process.env.RAILWAY_STATIC_URL) {
      return process.env.RAILWAY_STATIC_URL.startsWith('http') 
        ? process.env.RAILWAY_STATIC_URL 
        : `https://${process.env.RAILWAY_STATIC_URL}`;
    }
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    // Fallback to localhost
    return 'http://localhost:3000';
  };

  const swaggerUrl = getSwaggerUrl();
  console.log(`📚 Swagger documentation available at: ${swaggerUrl}/api-docs`);
};

export default specs;
