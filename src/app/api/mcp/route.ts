import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intent, type } = body;

    // Stages we return to update the UI
    const stages = [
      { id: 1, name: "Stage 1: Intent Analysis", status: "pending" },
      { id: 2, name: "Stage 2: Policy Validation", status: "pending" },
      { id: 3, name: "Stage 3: Transaction Simulation", status: "pending" },
      { id: 4, name: "Stage 4: Threat Detection", status: "pending" }
    ];

    if (type === 'safe') {
      return NextResponse.json({
        success: true,
        message: "Transaction Approved",
        stages: stages.map(s => ({ ...s, status: 'success' })),
        keeperHub: {
          status: "Submitted to KeeperHub",
          txHash: "0x123abc...",
          gasSaved: "15%"
        },
        zeroG: {
          merkleRoot: "0xabc123... (Audit Logged)"
        }
      });
    } else if (type === 'rogue') {
      return NextResponse.json({
        success: false,
        message: "Transaction Blocked - Honeypot Detected",
        stages: [
          { id: 1, name: "Stage 1: Intent Analysis", status: "success" },
          { id: 2, name: "Stage 2: Policy Validation", status: "warning" },
          { id: 3, name: "Stage 3: Transaction Simulation", status: "success" },
          { id: 4, name: "Stage 4: Threat Detection", status: "error" } // Blocked here
        ],
        keeperHub: {
          status: "Rejected by AgentARC - Blocked"
        },
        zeroG: {
          merkleRoot: "0xbad456... (Threat Report Logged)"
        }
      });
    }

    return NextResponse.json({ error: "Invalid intent type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
