import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

// GET /api/seed - Seeds the database with a default admin user (development only)
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Seed endpoint is only available in development' },
      { status: 503 }
    );
  }

  try {
    await dbConnect();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin@mail.com' });

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
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
      message: 'Admin user created successfully',
    });
  } catch (error) {
    console.error('Error seeding admin:', error);
    return NextResponse.json(
      { error: 'Failed to seed admin user' },
      { status: 500 }
    );
  }
}
