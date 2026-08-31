# Approval Document: Fix PDFKit Vercel Packaging

## Root cause confirmed from production logs
The production trace logs demonstrate that the execution fails immediately after `RG_EMAIL_TRACE_PDF_START` with the error:
`ENOENT: no such file or directory, open '/ROOT/node_modules/pdfkit/js/data/Helvetica.afm'`

PDFKit relies on reading standard font metric files (like `Helvetica.afm`) dynamically via the filesystem (`fs.readFileSync`) at runtime. Because these files are not statically imported into the codebase, Next.js's static analysis and file-tracing algorithm does not recognize them as dependencies. Consequently, they are stripped from the final Vercel serverless function bundle.

## Exact failing file/path
`node_modules/pdfkit/js/data/Helvetica.afm`

## Why Resend has no log
The error is thrown synchronously during the `generateInvoicePDF(order)` execution. Because `email.ts` invokes PDF generation *before* making the `Resend.emails.send()` API call, the synchronous throw jumps straight into the `catch` block. The Resend API call and its corresponding `RG_EMAIL_TRACE_RESEND_START` and `RG_EMAIL_TRACE_RESEND_SUCCESS` log statements are therefore never reached.

## Proposed minimal fix
Add `outputFileTracingIncludes` to `next.config.ts` to explicitly instruct the Next.js build system to include the required PDFKit data files in the serverless function bundle.

```typescript
const nextConfig: NextConfig = {
  // ... existing config ...
  outputFileTracingIncludes: {
    // Include PDFKit data files for all routes (covers API routes and Server Actions)
    '/**': ['./node_modules/pdfkit/js/data/**/*'],
  },
};
```
This is the narrowest safe pattern as it only includes the necessary `pdfkit/js/data` directory rather than the entire `node_modules` folder.

## Files expected to change
- `next.config.ts`

## Verification plan
A. **Run TypeScript validation:** Ensure the `next.config.ts` changes are valid.
B. **Run a production-equivalent build:** Execute `npm run build`.
C. **Inspect the generated build/output:** Check `.next/server/` or `.next/standalone/` (if enabled) to verify that `Helvetica.afm` is successfully copied into the final build output.
D. **Test PDF generation locally:** If possible, trigger the PDF generation path locally against the production build.
E. **Confirm completion:** Ensure `generateInvoicePDF()` finishes successfully without throwing an `ENOENT` error.
F. **Confirm trace logs:** Verify the execution successfully reaches `RG_EMAIL_TRACE_PDF_DONE`, `RG_EMAIL_TRACE_RESEND_START`, and `RG_EMAIL_TRACE_RESEND_SUCCESS`.

## Risks
- **Bundle Size:** Including the `pdfkit/js/data/**/*` files will increase the serverless function bundle size slightly (by ~400KB). This is negligible and well within Vercel's 50MB limits.
- **Route Matching:** If the `'/**'` route pattern does not successfully map to the specific Server Action or API route executing the PDF generation, the files might still be omitted. We will verify the inclusion during the build inspection step.

## Rollback plan
Revert the `outputFileTracingIncludes` addition in `next.config.ts` and redeploy.
