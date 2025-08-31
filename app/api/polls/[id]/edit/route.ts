import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Poll from '@/models/Poll';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();

    const { password, action, option } = await request.json();

    if (!password || !action) {
      return NextResponse.json(
        { error: 'Password and action are required' },
        { status: 400 }
      );
    }

    const poll = await Poll.findById(id);

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, poll.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    if (action === 'add' && option) {
      // Add new option
      poll.options.push(option);
      poll.votes.push(0);
    } else if (action === 'remove' && typeof option === 'number') {
      // Remove option at index
      if (option < 0 || option >= poll.options.length) {
        return NextResponse.json(
          { error: 'Invalid option index' },
          { status: 400 }
        );
      }
      poll.options.splice(option, 1);
      poll.votes.splice(option, 1);
    } else {
      return NextResponse.json(
        { error: 'Invalid action or option' },
        { status: 400 }
      );
    }

    await poll.save();

    return NextResponse.json({
      message: 'Poll updated successfully',
      options: poll.options,
    });

  } catch (error) {
    console.error('Error editing poll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
