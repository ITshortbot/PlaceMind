// ============================================================================
// File: frontend/tests/generation-save-roundtrip.spec.ts
// Description: Comprehensive Playwright acceptance tests for Core Generation
//              and Save Roundtrip:
//              1. Synthetic fixture: generate with resume_id grounds facts verbatim
//              2. Generate with prompt only: empty content, warning, apply disabled
//              3. Edit -> save -> reload: all sections & multi-items intact
//              4. Deliberately cleared field stays cleared on reload
//              5. Save idempotence: 2nd save updates same resume (count unchanged)
//              6. Edit name -> save -> reload: edited name shown (profile shadowed)
//              7. Legacy resume without meta_info loads cleanly
//              8. Print to PDF: all sections present in extracted text, no chrome
// ============================================================================

import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import * as fs from 'fs';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

test.describe('Core Generation + Save Roundtrip', () => {
  // Backend template generator has semaphore(1); run tests serially to prevent 429 busy collisions
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/resume');
    await page.evaluate(() => {
      window.localStorage.clear();
    });
  });

  test('1. Synthetic fixture: generate with resume_id grounds facts verbatim; review-before-apply transfers to builder', async ({
    page,
    request,
  }) => {
    // Create synthetic candidate resume
    const res = await request.post(`${BACKEND}/api/v1/resumes`, {
      data: {
        file_name: 'meera_synth_resume.txt',
        raw_text:
          'Meera Synth\nmeera.synth@example.com\n\nEXPERIENCE\nBuilt payment retry pipeline at SynthCorp\n\nSKILLS\nGo, Postgres',
        parsed_metadata: { candidate: 'synthetic' },
        sections: [
          {
            section_type: 'contact',
            content: 'Meera Synth | meera.synth@example.com',
            meta_info: {
              version: 1,
              draft: { name: 'Meera Synth', email: 'meera.synth@example.com' },
            },
          },
          {
            section_type: 'skills',
            content: 'Go, Postgres',
            meta_info: {
              version: 1,
              draft: { skills: ['Go', 'Postgres'] },
            },
          },
          {
            section_type: 'experience',
            content: 'Built payment retry pipeline at SynthCorp',
            meta_info: {
              version: 1,
              draft: {
                items: [
                  {
                    role: 'Systems Engineer',
                    company: 'SynthCorp',
                    bullets: ['Built payment retry pipeline at SynthCorp'],
                  },
                ],
              },
            },
          },
        ],
      },
    });
    expect(res.ok()).toBeTruthy();
    const created = await res.json();
    const resumeId = created.id;

    // Navigate to Template Studio with activeResumeId set
    await page.goto('/template');
    await page.evaluate((id) => {
      window.localStorage.setItem('placemind.activeResumeId', id);
    }, resumeId);

    // Trigger generate
    await page.locator('#prompt-input').fill('Clean single column technical resume');
    await page.locator('#generate-template-btn').click();

    // Wait for generation to complete and verify indicator badge
    await expect(page.locator('#facts-used-badge')).toBeVisible({ timeout: 15000 });

    // Verify preview contains grounded facts
    const sheet = page.locator('#resume-preview-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('Meera Synth');
    await expect(sheet).toContainText('Go');
    await expect(sheet).toContainText('Postgres');
    await expect(sheet).toContainText('SynthCorp');
    await expect(sheet).toContainText('Built payment retry pipeline at SynthCorp');

    // Verify "Use in builder" button is enabled
    const useBtn = page.locator('#use-in-builder-btn');
    await expect(useBtn).toBeEnabled();

    // Click "Use in builder"
    await useBtn.click();
    await page.waitForURL('**/resume');

    // Verify builder is populated with candidate facts
    await expect(page.locator('textarea[placeholder="Python, FastAPI, PostgreSQL"]')).toHaveValue(/Go.*Postgres/);
    await expect(page.locator('input[placeholder="Employer name"]').first()).toHaveValue('SynthCorp');
  });

  test('2. Generate with prompt only: content empty, warning visible, apply disabled', async ({
    page,
  }) => {
    await page.goto('/template');
    await page.evaluate(() => {
      window.localStorage.removeItem('placemind.activeResumeId');
    });

    await page.locator('#prompt-input').fill('Modern executive resume in teal');
    await page.locator('#generate-template-btn').click();

    // Warnings notice is displayed
    const warningNotice = page.locator('#generation-warnings-notice');
    await expect(warningNotice).toBeVisible();
    await expect(warningNotice).toContainText('No candidate facts were provided');

    // Apply button is disabled
    const useBtn = page.locator('#use-in-builder-btn');
    await expect(useBtn).toBeDisabled();
  });

  test('3. Edit -> save -> reload roundtrip with multi-item sections and projects', async ({
    page,
    request,
  }) => {
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');

    // Fill primary contact
    await page.locator('input[placeholder="Your name"]').fill('Devon Synth');
    await page.locator('input[placeholder="e.g. Backend Engineer"]').first().fill('Distributed Systems Lead');
    await page.locator('input[placeholder="you@example.com"]').fill('devon@synth.internal');
    await page.locator('input[placeholder="Optional"]').fill('+1 555 432 1098');
    await page.locator('textarea[placeholder="2-3 sentences about your experience"]').fill(
      'Specialized in building event-driven microservices with Raft and Kafka.'
    );
    await page.locator('textarea[placeholder="Python, FastAPI, PostgreSQL"]').fill('Rust, Go, Kubernetes, Kafka');

    // Fill primary role
    await page.locator('input[placeholder="Employer name"]').first().fill('SynthCorp');
    await page.locator('textarea[placeholder*="FastAPI services"]').first().fill(
      'Engineered multi-region replication handling 100k msg/sec\nReduced cross-region tail latency by 45%'
    );

    // Add 2nd role
    await page.getByRole('button', { name: /Add Role/i }).click();
    await page.locator('input[placeholder="e.g. Frontend Engineer"]').fill('Platform Engineer');
    await page.locator('input[placeholder="Employer name"]').nth(1).fill('CloudFlow');
    await page.locator('textarea[placeholder="Key achievements..."]').fill('Maintained Kubernetes clusters across 3 regions');

    // Add project
    await page.getByRole('button', { name: /Add Project/i }).click();
    await page.locator('input[placeholder="e.g. Distributed Vector Store"]').fill('KV-Raft Database');
    await page.locator('input[placeholder="e.g. github.com/user/project"]').fill('github.com/devon/kv-raft');
    await page.locator('textarea[placeholder="Key engineering challenges and results..."]').fill('Linearizable state machine with dynamic membership');

    // Fill primary education
    await page.locator('input[placeholder="e.g. B.Tech Computer Science"]').first().fill('M.S. in Computer Science');
    await page.locator('input[placeholder="University name"]').first().fill('Tech Institute');
    await page.locator('input[placeholder="e.g. 2023"]').first().fill('2022');

    // Save draft
    const saveBtn = page.getByRole('button', { name: /Save Draft/i });
    await saveBtn.click();
    await expect(page.getByText('Draft saved to your workspace.')).toBeVisible();

    // Verify resume ID was saved in localStorage
    const savedId = await page.evaluate(() => window.localStorage.getItem('placemind.activeResumeId'));
    expect(savedId).toBeTruthy();

    // Verify initial resume count
    const listRes1 = await request.get(`${BACKEND}/api/v1/resumes`);
    const resumes1 = await listRes1.json();
    const count1 = resumes1.length;

    // Second save: must be idempotent and update the same resume record
    await saveBtn.click();
    await expect(page.getByText('Draft saved to your workspace.')).toBeVisible();

    const listRes2 = await request.get(`${BACKEND}/api/v1/resumes`);
    const resumes2 = await listRes2.json();
    expect(resumes2.length).toBe(count1);

    // Reload the page and verify every section and item survived
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[placeholder="Your name"]')).toHaveValue('Devon Synth');
    await expect(page.locator('input[placeholder="you@example.com"]')).toHaveValue('devon@synth.internal');
    await expect(page.locator('textarea[placeholder="Python, FastAPI, PostgreSQL"]')).toHaveValue('Rust, Go, Kubernetes, Kafka');
    await expect(page.locator('input[placeholder="Employer name"]').first()).toHaveValue('SynthCorp');

    // Additional role survived
    await expect(page.locator('input[placeholder="Employer name"]').nth(1)).toHaveValue('CloudFlow');

    // Project survived
    await expect(page.locator('input[placeholder="e.g. Distributed Vector Store"]')).toHaveValue('KV-Raft Database');

    // Education survived
    await expect(page.locator('input[placeholder="e.g. B.Tech Computer Science"]').first()).toHaveValue('M.S. in Computer Science');
  });

  test('4. Deliberately cleared field stays cleared across save and reload', async ({ page }) => {
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="Your name"]').fill('Taylor Synth');
    await page.locator('textarea[placeholder="Python, FastAPI, PostgreSQL"]').fill('Python, Docker');

    // Save initial
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await expect(page.getByText('Draft saved to your workspace.')).toBeVisible();

    // Now deliberately clear the skills field
    await page.locator('textarea[placeholder="Python, FastAPI, PostgreSQL"]').fill('');

    // Save again with cleared skills
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await expect(page.getByText('Draft saved to your workspace.')).toBeVisible();

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify name is present and skills remained empty
    await expect(page.locator('input[placeholder="Your name"]')).toHaveValue('Taylor Synth');
    await expect(page.locator('textarea[placeholder="Python, FastAPI, PostgreSQL"]')).toHaveValue('');
  });

  test('5. Edit name -> save -> reload displays edited name, shadowing stale profile', async ({
    page,
  }) => {
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');

    // Seed a stale profile in localStorage
    await page.evaluate(() => {
      window.localStorage.setItem(
        'placemind.profile',
        JSON.stringify({ fullName: 'Old Profile Name', email: 'old@example.com' })
      );
    });

    // Enter and save updated name
    await page.locator('input[placeholder="Your name"]').fill('New Edited Name');
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await expect(page.getByText('Draft saved to your workspace.')).toBeVisible();

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Edited name must show, NOT the stale profile name
    await expect(page.locator('input[placeholder="Your name"]')).toHaveValue('New Edited Name');
  });

  test('6. Legacy resume without meta_info loads cleanly without dropping data', async ({
    page,
    request,
  }) => {
    const res = await request.post(`${BACKEND}/api/v1/resumes`, {
      data: {
        file_name: 'legacy_candidate.txt',
        raw_text:
          'Jordan Legacy\njordan@example.com\n\nEXPERIENCE\nSenior Developer\nShipped v1 backend architecture\n\nSKILLS\nJava, Spring Boot\n\nEDUCATION\nB.S. Computer Engineering, State College, 2018',
        parsed_metadata: { legacy: true },
        sections: [
          {
            section_type: 'contact',
            content: 'Jordan Legacy\njordan@example.com\n+1 555 888 9999',
          },
          {
            section_type: 'summary',
            content: 'Experienced backend developer.',
          },
          {
            section_type: 'skills',
            content: 'Java, Spring Boot, MySQL',
          },
          {
            section_type: 'experience',
            content: 'Senior Developer\nShipped v1 backend architecture\nManaged 5 engineers',
          },
          {
            section_type: 'education',
            content: 'B.S. Computer Engineering, State College, 2018',
          },
        ],
      },
    });
    expect(res.ok()).toBeTruthy();
    const legacyResume = await res.json();

    // Load in builder
    await page.goto('/resume');
    await page.evaluate((id) => {
      window.localStorage.setItem('placemind.activeResumeId', id);
    }, legacyResume.id);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Confirm legacy content hydrated
    await expect(page.locator('input[placeholder="Your name"]')).toHaveValue('Jordan Legacy');
    await expect(page.locator('input[placeholder="you@example.com"]')).toHaveValue('jordan@example.com');
    await expect(page.locator('textarea[placeholder="2-3 sentences about your experience"]')).toHaveValue('Experienced backend developer.');
    await expect(page.locator('textarea[placeholder="Python, FastAPI, PostgreSQL"]')).toHaveValue(/Java.*Spring Boot/);
    await expect(page.locator('input[placeholder="e.g. Backend Engineer"]').nth(1)).toHaveValue('Senior Developer');
    await expect(page.locator('textarea[placeholder*="FastAPI services"]').first()).toContainText('Shipped v1 backend architecture');
    await expect(page.locator('input[placeholder="e.g. B.Tech Computer Science"]').first()).toHaveValue('B.S. Computer Engineering');
  });

  test('7. Print to PDF: all sections and multi-item content present in extracted text, zero chrome', async ({
    page,
  }) => {
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');

    // Fill all sections
    await page.locator('input[placeholder="Your name"]').fill('Robin PrintSynth');
    await page.locator('input[placeholder="e.g. Backend Engineer"]').first().fill('Principal Architect');
    await page.locator('input[placeholder="you@example.com"]').fill('robin.synth@example.com');
    await page.locator('textarea[placeholder="2-3 sentences about your experience"]').fill(
      'Cloud architect specializing in high-resilience systems.'
    );
    await page.locator('textarea[placeholder="Python, FastAPI, PostgreSQL"]').fill('Go, C++, AWS, gRPC');

    // Primary role
    await page.locator('input[placeholder="Employer name"]').first().fill('CoreSynth Systems');
    await page.locator('textarea[placeholder*="FastAPI services"]').first().fill(
      'Architected distributed failover mechanism\nCut downtime to zero'
    );

    // Additional role
    await page.getByRole('button', { name: /Add Role/i }).click();
    await page.locator('input[placeholder="e.g. Frontend Engineer"]').fill('Senior Infrastructure Engineer');
    await page.locator('input[placeholder="Employer name"]').nth(1).fill('CloudStack');
    await page.locator('textarea[placeholder="Key achievements..."]').fill('Scaled telemetry pipeline');

    // Add project
    await page.getByRole('button', { name: /Add Project/i }).click();
    await page.locator('input[placeholder="e.g. Distributed Vector Store"]').fill('High-Speed RPC Engine');
    await page.locator('textarea[placeholder="Key engineering challenges and results..."]').fill('Custom zero-copy protocol implementation');

    // Education
    await page.locator('input[placeholder="e.g. B.Tech Computer Science"]').first().fill('B.S. in Electrical Engineering');
    await page.locator('input[placeholder="University name"]').first().fill('Global Tech University');
    await page.locator('input[placeholder="e.g. 2023"]').first().fill('2019');

    // Save draft
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await expect(page.getByText('Draft saved to your workspace.')).toBeVisible();

    // Export PDF via Playwright page.pdf()
    const pdfPath = '/tmp/roundtrip-test-print.pdf';
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
    });

    expect(fs.existsSync(pdfPath)).toBeTruthy();

    // Extract text from the PDF using PyMuPDF / fitz
    const extractScript = [
      'import fitz',
      `doc = fitz.open("${pdfPath}")`,
      'full_text = "\\n".join(page.get_text() for page in doc)',
      'print(full_text)',
    ].join('; ');

    const pythonBin = process.env.PDF_TEST_PYTHON || 'python3';
    let extractedText = '';
    try {
      extractedText = execFileSync(
        pythonBin,
        ['-c', extractScript],
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    } catch (err: unknown) {
      const execErr = err as { code?: string; stderr?: Buffer | string; message?: string };
      const stderr = execErr?.stderr ? execErr.stderr.toString() : '';
      const message = execErr?.message || String(err);
      if (execErr?.code === 'ENOENT') {
        throw new Error(
          `Print-to-PDF verification failed: Python interpreter "${pythonBin}" was not found on PATH or via PDF_TEST_PYTHON. Please install python3 or set PDF_TEST_PYTHON to a valid Python executable with PyMuPDF installed.`
        );
      }
      if (stderr.includes('No module named') || stderr.includes('fitz') || message.includes('fitz')) {
        throw new Error(
          `Print-to-PDF verification failed: Python interpreter "${pythonBin}" failed to import the 'fitz' (PyMuPDF) module. Stderr: ${stderr.trim()}. Please install pymupdf or point PDF_TEST_PYTHON to an environment with fitz installed.`
        );
      }
      throw new Error(
        `Print-to-PDF verification failed executing "${pythonBin}": ${message}. Stderr: ${stderr.trim()}`
      );
    }

    // Verify all sections and items are in extracted PDF text
    expect(extractedText).toContain('Robin PrintSynth');
    expect(extractedText).toContain('robin.synth@example.com');
    expect(extractedText).toContain('Cloud architect specializing in high-resilience systems');
    expect(extractedText).toContain('CoreSynth Systems');
    expect(extractedText).toContain('Architected distributed failover mechanism');
    expect(extractedText).toContain('CloudStack');
    expect(extractedText).toContain('Senior Infrastructure Engineer');
    expect(extractedText).toContain('High-Speed RPC Engine');
    expect(extractedText).toContain('Global Tech University');
    expect(extractedText).toContain('B.S. in Electrical Engineering');

    // Verify app chrome is completely excluded from PDF
    expect(extractedText).not.toContain('Dashboard');
    expect(extractedText).not.toContain('Resume Builder');
    expect(extractedText).not.toContain('Export PDF');
    expect(extractedText).not.toContain('Save Draft');
    expect(extractedText).not.toContain('Your Information');
    expect(extractedText).not.toContain('Template Layout');

    // Clean up temporary PDF
    try {
      fs.unlinkSync(pdfPath);
    } catch {}
  });
});
