import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Poll from '@/models/Poll';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();

    const { optionIndex } = await request.json();

    if (typeof optionIndex !== 'number' || optionIndex < 0) {
      return NextResponse.json(
        { error: 'Valid option index is required' },
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

    if (optionIndex >= poll.options.length) {
      return NextResponse.json(
        { error: 'Invalid option index' },
        { status: 400 }
      );
    }

    // Increment the vote for the selected option
    poll.votes[optionIndex] += 1;
    await poll.save();

    // Calculate updated percentages
    const totalVotes = poll.votes.reduce((sum: number, vote: number) => sum + vote, 0);
    const results = poll.options.map((option: string, index: number) => ({
      option,
      votes: poll.votes[index],
      percentage: totalVotes > 0 ? Math.round((poll.votes[index] / totalVotes) * 100) : 0,
    }));

    return NextResponse.json({
      message: 'Vote recorded successfully',
      results,
      totalVotes,
    });

  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
