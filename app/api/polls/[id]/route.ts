import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Poll from '@/models/Poll';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();

    const poll = await Poll.findById(id);

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Calculate percentages
    const totalVotes = poll.votes.reduce((sum: number, vote: number) => sum + vote, 0);
    const results = poll.options.map((option: string, index: number) => ({
      option,
      votes: poll.votes[index],
      percentage: totalVotes > 0 ? Math.round((poll.votes[index] / totalVotes) * 100) : 0,
    }));

    return NextResponse.json({
      id: poll._id,
      question: poll.question,
      options: poll.options,
      results,
      totalVotes,
      createdAt: poll.createdAt,
    });

  } catch (error) {
    console.error('Error fetching poll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
