'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    date: z.string(),
    status: z.enum(['pending', 'paid']),
    amount: z.coerce.number(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    const { customerId, status, amount } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        status: formData.get('status'),
        amount: formData.get('amount'),
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (e) {
        return { message: 'Error while creating an invoice' };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, status, amount } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        status: formData.get('status'),
        amount: formData.get('amount'),
    });
    const amountInCents = amount * 100;

    try {
        await sql`
            UPDATE invoices
            SET customer_id=${customerId}, amount=${amountInCents}, status=${status}
            WHERE id=${id}
        `;
    } catch (e) {
        return { message: 'Error while updating an invoice' };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    try {
        await sql`
            DELETE FROM invoices
            WHERE id=${id}
        `;
        revalidatePath('/dashboard/invoices');
    } catch (e) {
        return {
            message: 'Error while deleting an invoice',
        };
    }
}
