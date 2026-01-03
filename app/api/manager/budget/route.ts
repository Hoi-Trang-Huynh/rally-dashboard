import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Expense } from "@/types";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // "MM-YYYY"

    const { db } = await connectToDatabase();
    
    const query: any = {};
    if (month) {
        query.month = month;
    }

    const expenses = await db.collection<Expense>("expenses")
        .find(query)
        .sort({ date: -1 })
        .toArray();

    // Calculate summaries
    const totalCost = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Calculate total contributions per user (based on shares)
    const contributions: Record<string, number> = {};
    expenses.forEach(e => {
        if (e.shares) {
            Object.entries(e.shares).forEach(([user, amount]) => {
                contributions[user] = (contributions[user] || 0) + amount;
            });
        }
    });

    return NextResponse.json({
        expenses,
        summary: {
            totalCost,
            contributions
        }
    });

  } catch (error) {
    console.error("Budget API Error:", error);
    return NextResponse.json({ error: "Failed to fetch budget data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, amount, date, shares, category, paidBy } = body;

        const { db } = await connectToDatabase();

        const dateObj = new Date(date);
        const month = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
        
        const newExpense: Expense = {
            title,
            amount: Number(amount),
            currency: "VND",
            date, // ISO string
            month,
            category: category || "General",
            paidBy: paidBy || "Split",
            shares: shares || {},
            createdAt: new Date().toISOString()
        };

        const result = await db.collection("expenses").insertOne(newExpense as any);

        return NextResponse.json({ success: true, id: result.insertedId });
    } catch (error) {
        console.error("Budget Create Error:", error);
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { _id, title, amount, shares, category, paidBy } = body;

        console.log("Budget PUT request:", { _id, title, paidBy, amount, shares });

        if (!_id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const { db } = await connectToDatabase();
        
        const updateData: Partial<Expense> = {
            title,
            amount: Number(amount),
            // Date and Month are immutable on edit
            category: category || "General",
            paidBy, // Use the explicit payer from frontend
            shares: shares || {}
        };

        const result = await db.collection("expenses").updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateData }
        );

        console.log("Update result:", result);

        if (result.matchedCount === 0) {
             console.error("No expense found with ID:", _id);
             return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Budget Update Error:", error);
        return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        
        console.log("Budget DELETE request:", id);

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const { db } = await connectToDatabase();
        
        const result = await db.collection("expenses").deleteOne({ _id: new ObjectId(id) });
        console.log("Delete result:", result);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Budget Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
    }
}
