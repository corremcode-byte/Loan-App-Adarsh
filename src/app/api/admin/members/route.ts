import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

// GET /api/admin/members - Get all team members
export async function GET() {
  try {
    await dbConnect();

    const members = await Admin.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/admin/members - Add new team member
export async function POST(request: Request) {
  try {
    await dbConnect();

    const { username, password, name, role } = await request.json();

    // Validate required fields
    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Username, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingAdmin = await Admin.findOne({
      username: username.toLowerCase(),
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create new admin/team member
    const admin = new Admin({
      username: username.toLowerCase(),
      password,
      name,
      role: role || 'manager',
    });

    await admin.save();

    return NextResponse.json({
      success: true,
      member: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}
