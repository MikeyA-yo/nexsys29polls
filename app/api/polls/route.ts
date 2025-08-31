import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Poll from '@/models/Poll';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { question, options, password } = await request.json();

    if (!question || !options || !password) {
      return NextResponse.json(
        { error: 'Question, options, and password are required' },
        { status: 400 }
      );
    }

    if (options.length < 2) {
      return NextResponse.json(
        { error: 'A poll must have at least 2 options' },
        { status: 400 }
      );
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the poll
    const poll = new Poll({
      question,
      options,
      passwordHash,
      votes: new Array(options.length).fill(0),
    });

    await poll.save();

    return NextResponse.json({
      id: poll._id,
      message: 'Poll created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
