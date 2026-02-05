import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

// GET /api/seed - Seeds the database with a default admin user
export async function GET() {
  try {
    await dbConnect();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin@mail.com' });

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
        credentials: {
          username: 'admin@mail.com',
          password: 'admin12',
        },
      });
    }

    // Create default admin user
    const admin = new Admin({
      username: 'admin@mail.com',
      password: 'admin12',
      name: 'Admin User',
      role: 'admin',
    });

    await admin.save();

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully!',
      credentials: {
        username: 'admin@mail.com',
        password: 'admin12',
      },
    });
  } catch (error) {
    console.error('Error seeding admin:', error);
    return NextResponse.json(
      { error: 'Failed to seed admin user' },
      { status: 500 }
    );
  }
}
