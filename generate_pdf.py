import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Output PDF path
OUTPUT_DIR = r"C:\Users\HP\Downloads"
OUTPUT_PDF = os.path.join(OUTPUT_DIR, "Enterprise_Employee_Management_System_Architecture_And_Code.pdf")

# Two-pass NumberedCanvas for "Page X of Y" and Running Headers/Footers
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setStrokeColor(colors.HexColor("#777777"))
        self.setFillColor(colors.HexColor("#333333"))
        self.setLineWidth(0.5)

        # Draw Running Header on page 2 onwards
        if self._pageNumber > 1:
            self.drawString(36, 11 * inch - 26, "Enterprise Employee Management System | Technical Architecture & Code Reference")
            self.drawRightString(8.5 * inch - 36, 11 * inch - 26, "Jatin Lekkala")
            self.line(36, 11 * inch - 30, 8.5 * inch - 36, 11 * inch - 30)

        # Draw Running Footer on all pages
        self.line(36, 30, 8.5 * inch - 36, 30)
        self.drawString(36, 20, "ASP.NET Core 8 Web API + EF Core + SQL Server + Custom Middleware + React Vite")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 36, 20, page_str)
        self.restoreState()

def add_code_section(story, title, code_text, styles, chunk_size=35):
    """
    Renders clean code blocks with:
    - Pure white background (for clean black & white printing)
    - Thin border
    - Distinct title
    - Page-break friendly chunking (never triggers LayoutError on multi-page files)
    """
    story.append(Paragraph(f"<b>{title}</b>", styles['CodeHeader']))
    story.append(Spacer(1, 3))
    
    cleaned_code = code_text.replace("\t", "    ").strip()
    raw_lines = cleaned_code.split("\n")
    
    # Wrap lines longer than 96 characters to prevent clipping
    formatted_lines = []
    for line in raw_lines:
        if len(line) > 96:
            formatted_lines.append(line[:96])
            formatted_lines.append("    " + line[96:])
        else:
            formatted_lines.append(line)
            
    # Chunk into digestible blocks of lines
    total_lines = len(formatted_lines)
    for i in range(0, total_lines, chunk_size):
        chunk = formatted_lines[i:i + chunk_size]
        pre = Preformatted("\n".join(chunk), styles['CodeText'])
        story.append(pre)
        if i + chunk_size < total_lines:
            story.append(Spacer(1, 2))
            
    story.append(Spacer(1, 8))

def build_pdf():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=42
    )

    base_styles = getSampleStyleSheet()
    
    # Custom High-Contrast Typography Styles (Optimized for Black/White Printing)
    styles = {
        'DocTitle': ParagraphStyle(
            'DocTitle',
            parent=base_styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=21,
            leading=25,
            textColor=colors.black,
            spaceAfter=4,
            alignment=0
        ),
        'DocSubtitle': ParagraphStyle(
            'DocSubtitle',
            parent=base_styles['Normal'],
            fontName='Helvetica',
            fontSize=10.5,
            leading=14.5,
            textColor=colors.HexColor("#333333"),
            spaceAfter=10
        ),
        'MetaText': ParagraphStyle(
            'MetaText',
            parent=base_styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11.5,
            textColor=colors.HexColor("#222222")
        ),
        'SectionH1': ParagraphStyle(
            'SectionH1',
            parent=base_styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=17,
            textColor=colors.black,
            spaceBefore=12,
            spaceAfter=5,
            keepWithNext=True
        ),
        'SectionH2': ParagraphStyle(
            'SectionH2',
            parent=base_styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#111111"),
            spaceBefore=8,
            spaceAfter=3,
            keepWithNext=True
        ),
        'Body': ParagraphStyle(
            'Body',
            parent=base_styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.black,
            spaceAfter=5
        ),
        'BodyBold': ParagraphStyle(
            'BodyBold',
            parent=base_styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=13,
            textColor=colors.black,
            spaceAfter=4
        ),
        'Bullet': ParagraphStyle(
            'Bullet',
            parent=base_styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.black,
            leftIndent=15,
            firstLineIndent=-10,
            spaceAfter=2.5
        ),
        'CodeHeader': ParagraphStyle(
            'CodeHeader',
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11,
            textColor=colors.black,
            keepWithNext=True
        ),
        'CodeText': ParagraphStyle(
            'CodeText',
            fontName='Courier',
            fontSize=7.0,
            leading=8.6,
            textColor=colors.black,
            backColor=colors.white,
            borderColor=colors.HexColor("#555555"),
            borderWidth=0.5,
            borderPadding=5
        ),
        'QAQuestion': ParagraphStyle(
            'QAQuestion',
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=13.5,
            textColor=colors.black,
            spaceBefore=7,
            spaceAfter=2,
            keepWithNext=True
        ),
        'QAAnswer': ParagraphStyle(
            'QAAnswer',
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#111111"),
            spaceAfter=5
        )
    }

    story = []

    # =========================================================================
    # HEADER / METADATA
    # =========================================================================
    story.append(Paragraph("Enterprise Employee Management System", styles['DocTitle']))
    story.append(Paragraph("End-to-End Architectural Reference & Complete Source Code Implementation", styles['DocSubtitle']))
    story.append(HRFlowable(width="100%", thickness=1.2, color=colors.black, spaceBefore=0, spaceAfter=8))

    meta_table_data = [
        [
            Paragraph("<b>Author:</b> Jatin Lekkala<br/><b>Role:</b> AI Engineer & .NET Full-Stack Engineer<br/><b>Live App:</b> https://jatinlekkala.com/projects/employeeManagementSystem/", styles['MetaText']),
            Paragraph("<b>Stack:</b> ASP.NET Core 8 Web API, EF Core 8, SQL Server, React Vite<br/><b>Test Suite:</b> 16 Automated xUnit Tests (100% Passed)<br/><b>Format:</b> High-Contrast Black & White Print Edition (Pure White BG)", styles['MetaText'])
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#555555")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#999999")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 1: ARCHITECTURE OVERVIEW
    # =========================================================================
    story.append(Paragraph("1. Executive Architectural Overview", styles['SectionH1']))
    story.append(Paragraph(
        "This project implements an enterprise-grade full-stack solution built upon a clear <b>Controller → Service → EF Core → SQL Server</b> separation of concerns. "
        "The architecture is designed to demonstrate professional coding discipline for a 3-year full-stack developer, isolating presentation, business rules, data access, and cross-cutting pipeline concerns without unnecessary design pattern bloat.",
        styles['Body']
    ))

    arch_layers = [
        ["Layer", "Technology", "Responsibility & Separation of Concerns"],
        ["Presentation (API)", "ASP.NET Core 8 Web API", "HTTP protocol translation, request binding, model validation triggering, and standard status responses (200, 201 CreatedAtAction, 204, 400, 404, 409). Thin controllers with zero SQL or business logic."],
        ["Middleware Pipeline", "Custom C# Middleware", "Cross-cutting request tracing via Correlation IDs (X-Correlation-ID), execution profiling using Stopwatch, and centralized RFC 7807 ProblemDetails exception handling."],
        ["Business Logic (Service)", "IEmployeeService / C#", "Enforces domain rules: case-insensitive email normalization, duplicate email detection, valid salary (> 0), conflict checks on updates, and DTO projection."],
        ["Data Access (ORM)", "EF Core 8 / SQL Server", "Fluent API configuration, unique indexes on normalized emails, decimal precision (18,2), AsNoTracking() read optimization, and atomic SaveChangesAsync() commits."],
        ["Frontend Dashboard", "React 18 + Vite", "Controlled form inputs, double-submission guards, live client-side search/filtering, centralized Axios client, and seamless offline/demo simulation for static hosting."]
    ]
    arch_table = Table(arch_layers, colWidths=[110, 110, 320])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.white),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7.5),
        ('LEADING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#777777")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 2: CUSTOM USER-DEFINED MIDDLEWARE
    # =========================================================================
    story.append(Paragraph("2. Custom User-Defined Middleware & Pipeline Ordering", styles['SectionH1']))
    story.append(Paragraph(
        "ASP.NET Core executes middleware components sequentially for incoming requests and in reverse order for outgoing responses. "
        "Custom middleware provides pipeline-level guarantees across all endpoints, including non-controller routes.",
        styles['Body']
    ))
    story.append(Paragraph("<b>Pipeline Registration Order in Program.cs:</b>", styles['BodyBold']))
    story.append(Paragraph("1. <b>ExceptionHandlingMiddleware</b>: Placed first so it wraps the entire downstream pipeline. Intercepts all unhandled exceptions and formats standard RFC 7807 JSON.", styles['Bullet']))
    story.append(Paragraph("2. <b>RequestLoggingMiddleware</b>: Stamped immediately after exception handling to generate or validate X-Correlation-ID, record start time, and log final status code.", styles['Bullet']))
    story.append(Paragraph("3. <b>Swagger / OpenAPI</b>: API documentation explorer.", styles['Bullet']))
    story.append(Paragraph("4. <b>CORS (Cross-Origin Resource Sharing)</b>: Whitelists frontend origins and exposes X-Correlation-ID header.", styles['Bullet']))
    story.append(Paragraph("5. <b>MapControllers</b>: Routes requests to controller action methods.", styles['Bullet']))
    story.append(Spacer(1, 4))

    # Embed RequestLoggingMiddleware.cs
    req_log_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\Middleware\RequestLoggingMiddleware.cs"
    if os.path.exists(req_log_path):
        with open(req_log_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 1: RequestLoggingMiddleware.cs (Distributed Tracing & Execution Profiling)", f.read(), styles)

    # Embed ExceptionHandlingMiddleware.cs
    exc_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\Middleware\ExceptionHandlingMiddleware.cs"
    if os.path.exists(exc_path):
        with open(exc_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 2: ExceptionHandlingMiddleware.cs (Centralized RFC 7807 Error Formatting)", f.read(), styles)

    # Embed Program.cs
    prog_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\Program.cs"
    if os.path.exists(prog_path):
        with open(prog_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 3: Program.cs (Service Dependency Injection & Pipeline Ordering)", f.read(), styles)

    # =========================================================================
    # SECTION 3: DATABASE ENTITY & FLUENT CONFIGURATION
    # =========================================================================
    story.append(Paragraph("3. Entity Framework Core & SQL Server Data Modeling", styles['SectionH1']))
    story.append(Paragraph(
        "Data persistence utilizes Code-First Entity Framework Core 8 with SQL Server. We employ <b>IEntityTypeConfiguration&lt;Employee&gt;</b> "
        "rather than polluting domain models with database-specific annotations. This cleanly separates domain shape from database mapping rules.",
        styles['Body']
    ))
    story.append(Paragraph("<b>Key Database Safeguards:</b>", styles['BodyBold']))
    story.append(Paragraph("• <b>Unique Index Constraint:</b> A database-level unique index (<code>IX_Employees_Email_Unique</code>) ensures email uniqueness even under simultaneous concurrent race conditions.", styles['Bullet']))
    story.append(Paragraph("• <b>Decimal Precision:</b> Configured with <code>HasPrecision(18, 2)</code> to avoid floating-point rounding errors in payroll calculations.", styles['Bullet']))
    story.append(Paragraph("• <b>Default Timestamp:</b> Uses <code>GETUTCDATE()</code> for database-level audit creation timestamps.", styles['Bullet']))
    story.append(Spacer(1, 4))

    # Embed Employee.cs
    emp_model_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\Models\Employee.cs"
    if os.path.exists(emp_model_path):
        with open(emp_model_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 4: Models/Employee.cs (Domain Entity)", f.read(), styles)

    # Embed EmployeeConfiguration.cs
    emp_cfg_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\Data\Configurations\EmployeeConfiguration.cs"
    if os.path.exists(emp_cfg_path):
        with open(emp_cfg_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 5: Data/Configurations/EmployeeConfiguration.cs (Fluent API Mapping & Constraints)", f.read(), styles)

    # Embed AppDbContext.cs
    db_ctx_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\Data\AppDbContext.cs"
    if os.path.exists(db_ctx_path):
        with open(db_ctx_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 6: Data/AppDbContext.cs (EF Core Database Context)", f.read(), styles)

    # =========================================================================
    # SECTION 4: SERVICE LAYER & BUSINESS RULES
    # =========================================================================
    story.append(Paragraph("4. Domain Service Layer & Business Invariants", styles['SectionH1']))
    story.append(Paragraph(
        "The <b>EmployeeService</b> implements the core business logic. Controllers never perform database queries or enforce business rules directly. "
        "The service layer handles email normalization, duplicate checks, update conflicts, and maps between domain entities and DTOs.",
        styles['Body']
    ))

    # Embed IEmployeeService.cs
    iemp_service_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\Services\IEmployeeService.cs"
    if os.path.exists(iemp_service_path):
        with open(iemp_service_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 7: Services/IEmployeeService.cs (Service Interface Contract)", f.read(), styles)

    # Embed EmployeeService.cs
    emp_service_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\Services\EmployeeService.cs"
    if os.path.exists(emp_service_path):
        with open(emp_service_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 8: Services/EmployeeService.cs (Business Logic Implementation)", f.read(), styles)

    # Embed DuplicateEmailException.cs
    dup_ex_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\Exceptions\DuplicateEmailException.cs"
    if os.path.exists(dup_ex_path):
        with open(dup_ex_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 9: Exceptions/DuplicateEmailException.cs (Custom Domain Exception)", f.read(), styles)

    # =========================================================================
    # SECTION 5: CONTROLLER LAYER & DTOS
    # =========================================================================
    story.append(Paragraph("5. API Controller Layer & Request/Response DTOs", styles['SectionH1']))
    story.append(Paragraph(
        "<b>EmployeesController</b> is a thin presentation controller. It validates requests, delegates work to <code>IEmployeeService</code>, "
        "and returns standard HTTP status codes. Domain entities are never exposed directly in responses; dedicated request/response DTOs prevent mass-assignment attacks and schema leakage.",
        styles['Body']
    ))

    # Embed CreateEmployeeRequest.cs
    create_dto_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\DTOs\CreateEmployeeRequest.cs"
    if os.path.exists(create_dto_path):
        with open(create_dto_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 10: DTOs/CreateEmployeeRequest.cs (Input Validation Attributes)", f.read(), styles)

    # Embed UpdateEmployeeRequest.cs
    update_dto_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\DTOs\UpdateEmployeeRequest.cs"
    if os.path.exists(update_dto_path):
        with open(update_dto_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 11: DTOs/UpdateEmployeeRequest.cs (Update Request Contract)", f.read(), styles)

    # Embed EmployeeResponse.cs
    resp_dto_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\DTOs\EmployeeResponse.cs"
    if os.path.exists(resp_dto_path):
        with open(resp_dto_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 12: DTOs/EmployeeResponse.cs (Output Projection Contract)", f.read(), styles)

    # Embed EmployeesController.cs
    ctrl_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Api\Controllers\EmployeesController.cs"
    if os.path.exists(ctrl_path):
        with open(ctrl_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 13: Controllers/EmployeesController.cs (RESTful Endpoints)", f.read(), styles)

    # =========================================================================
    # SECTION 6: AUTOMATED TESTING (xUnit)
    # =========================================================================
    story.append(Paragraph("6. Automated Testing Suite (xUnit + Moq)", styles['SectionH1']))
    story.append(Paragraph(
        "The project contains a comprehensive automated test suite (<code>EmployeeManagement.Tests</code>) executing 16 tests in under 5 seconds. "
        "It verifies business invariants, case-insensitive duplicate checks, update conflicts, not-found behavior, and controller status code semantics.",
        styles['Body']
    ))

    # Embed EmployeeServiceTests.cs
    tests_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Tests\EmployeeServiceTests.cs"
    if os.path.exists(tests_path):
        with open(tests_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 14: Tests/EmployeeServiceTests.cs (xUnit Business Rule Tests)", f.read(), styles)

    # Embed EmployeesControllerTests.cs
    ctrl_tests_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\backend\EmployeeManagement.Tests\EmployeesControllerTests.cs"
    if os.path.exists(ctrl_tests_path):
        with open(ctrl_tests_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 15: Tests/EmployeesControllerTests.cs (Controller HTTP Status Tests)", f.read(), styles)

    # =========================================================================
    # SECTION 7: REACT FRONTEND ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("7. React Frontend Architecture (Vite)", styles['SectionH1']))
    story.append(Paragraph(
        "The frontend is built using React 18 and Vite. It implements controlled components, debounced searching, instant department/status filtering, "
        "loading indicators, optimistic toast feedback, double-submission guards, and centralized error parsing.",
        styles['Body']
    ))

    # Embed employeeApi.js
    api_js_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\frontend\employee-management-ui\src\api\employeeApi.js"
    if os.path.exists(api_js_path):
        with open(api_js_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 16: src/api/employeeApi.js (Axios Client & Offline Dual-Mode Fallback)", f.read(), styles)

    # Embed EmployeeForm.jsx
    form_jsx_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\frontend\employee-management-ui\src\components\EmployeeForm.jsx"
    if os.path.exists(form_jsx_path):
        with open(form_jsx_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 17: src/components/EmployeeForm.jsx (Controlled Form & Validation)", f.read(), styles)

    # Embed EmployeesPage.jsx
    page_jsx_path = r"C:\Users\HP\OneDrive\Jatin\Protfolio website\frontend\employee-management-ui\src\pages\EmployeesPage.jsx"
    if os.path.exists(page_jsx_path):
        with open(page_jsx_path, 'r', encoding='utf-8') as f:
            add_code_section(story, "Listing 18: src/pages/EmployeesPage.jsx (Dashboard State & Action Orchestration)", f.read(), styles)

    # =========================================================================
    # SECTION 8: TECHNICAL INTERVIEW PREPARATION (Q&A)
    # =========================================================================
    story.append(Paragraph("8. Technical Interview Preparation (Top 12 Questions & Model Answers)", styles['SectionH1']))
    story.append(Paragraph(
        "Below are high-impact architectural and behavioral questions specifically derived from this codebase, formulated for full-stack engineering interviews.",
        styles['Body']
    ))

    qa_list = [
        ("Q1: What is ASP.NET Core middleware and why did we build custom middleware instead of relying on Action Filters?",
         "Middleware executes for ALL HTTP requests across the entire application lifecycle—including 404 routes, static files, and authentication failures—whereas Action Filters only run after routing has resolved to a controller. Placing RequestLoggingMiddleware and ExceptionHandlingMiddleware in the outer pipeline guarantees that every request receives an X-Correlation-ID, duration tracking, and RFC 7807 ProblemDetails handling regardless of where an exception occurs."),

        ("Q2: Why is middleware registration order so critical in Program.cs?",
         "Middleware executes in registration order on incoming requests and in reverse order on outgoing responses. ExceptionHandlingMiddleware must be registered first so it wraps all downstream middleware and controllers. When placed first, any downstream exception bubbles up, is caught, translated into a structured response, and passed to RequestLoggingMiddleware to log the final HTTP status code cleanly."),

        ("Q3: What are the differences between Transient, Scoped, and Singleton service lifetimes in ASP.NET Core? Why is AppDbContext Scoped?",
         "Transient creates a new instance on every injection. Scoped creates one instance per HTTP request. Singleton creates a single instance for the entire application lifetime. AppDbContext is Scoped because: 1) It maintains an in-memory ChangeTracker that would leak memory and cause cross-thread concurrency crashes if it were Singleton; 2) If it were Transient, multiple services in the same request would receive different DbContext instances, preventing unified transaction commits across SaveChangesAsync()."),

        ("Q4: What does AsNoTracking() do and when should you use it?",
         "By default, EF Core tracks queried entities in its ChangeTracker to detect property changes. AsNoTracking() tells EF Core to skip snapshot creation and tracker registration. This dramatically cuts memory allocation and CPU overhead. It should ALWAYS be used for read-only queries (e.g. GET /api/employees). For write operations where entities are updated or deleted, tracked queries (like FindAsync) are used."),

        ("Q5: How does EF Core translate LINQ into SQL? What is client evaluation vs server evaluation?",
         "The C# compiler creates an IQueryable expression tree. EF Core parses this tree into a relational SQL Abstract Syntax Tree (AST) and outputs parameterized SQL (sp_executesql). Server evaluation executes filtering and sorting in SQL Server. If an expression cannot be translated into SQL, modern EF Core throws an exception to prevent client evaluation (which previously loaded entire tables into web server memory)."),

        ("Q6: Why is an application-level duplicate email check not sufficient? How does the database protect data integrity?",
         "Checking AnyAsync() before saving is vulnerable to race conditions under concurrent requests: two identical requests can pass the check simultaneously and both issue an INSERT. The unique index (IX_Employees_Email_Unique) in SQL Server acts as the definitive safeguard. When a race condition occurs, SQL Server rejects the duplicate, throwing a DbUpdateException which our service catches and maps to a friendly 409 Conflict."),

        ("Q7: How does this application protect against SQL Injection attacks?",
         "The application exclusively uses EF Core LINQ queries which compile into parameterized queries. User inputs are treated strictly as parameter values (@p0, @p1) by SQL Server's query engine rather than executable SQL syntax, completely neutralizing injection risks."),

        ("Q8: Why are DTOs mandatory instead of returning EF Core entities directly?",
         "Exposing database entities leaks internal table schemas, creates serialization cycles, and introduces over-posting vulnerabilities (where malicious users bind unwanted fields like Id, CreatedAtUtc, or internal permissions). DTOs establish an explicit, versionable contract between client and server."),

        ("Q9: Why does POST /api/employees return CreatedAtAction (201 Created) instead of Ok (200 OK)?",
         "Per HTTP/1.1 REST standards (RFC 7231), resource creation must return 201 Created accompanied by a Location header specifying the canonical URI of the newly created resource (e.g. /api/employees/12). CreatedAtAction sets the status, computes the URL, and serializes the response DTO in a single step."),

        ("Q10: How does the React application prevent double submissions?",
         "In EmployeeForm.jsx, the form submission sets isSubmitting to true, which disables the submit button and inputs while displaying an active spinner. This prevents accidental multi-clicks from firing duplicate POST requests to the API."),

        ("Q11: How would you diagnose an API endpoint that takes 4 seconds to respond?",
         "1) Inspect server logs using the X-Correlation-ID to confirm if time was spent in API execution or upstream network transit. 2) Profile SQL Server queries using SQL Profiler or EF Core command logging to detect Table Scans vs Index Seeks. 3) Check for N+1 query loops. 4) Verify database connection pool health. 5) Use OpenTelemetry or Application Insights for distributed traces."),

        ("Q12: What architectural changes would you implement before deploying this solution to a high-scale production environment?",
         "1) Authentication & Authorization: Integrate ASP.NET Core Identity with JWT Bearer tokens and Role-Based Access Control. 2) Distributed Caching: Add Redis via IDistributedCache for fast department and lookup reads. 3) Rate Limiting: Enable .NET 8 Rate Limiter middleware. 4) Observability: Replace console logging with Serilog and OpenTelemetry. 5) Resiliency: Enable EF Core EnableRetryOnFailure for transient SQL connection drops. 6) Docker & Kubernetes containerization with liveness/readiness health check probes.")
    ]

    for q, a in qa_list:
        story.append(Paragraph(f"<b>{q}</b>", styles['QAQuestion']))
        story.append(Paragraph(a, styles['QAAnswer']))
        story.append(Spacer(1, 2))

    # Build PDF document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated successfully at: {OUTPUT_PDF}")

if __name__ == "__main__":
    build_pdf()
