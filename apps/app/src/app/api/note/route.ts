import { NextRequest, NextResponse } from 'next/server';
import { database } from "@repo/database/client";

export async function GET(request: NextRequest) {

    const userId = ''; // 토큰에서 추출한 사용자 uid

    // RLS 적용 전
    const result = await database.note.findMany({
        where: {
            userId: userId
        }
    });
    
    // RLS 적용 후
    // const result = await database.$transaction(async (tx) => {
    //     await tx.$executeRawUnsafe(`select set_config('app.current_user_id', '${userId}', true)`);

    //     // 이제 RLS 적용됨
    //     const notes = await tx.note.findMany();
    //     return notes;
    // });

    return NextResponse.json(result);
}