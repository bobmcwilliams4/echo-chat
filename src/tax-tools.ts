// Echo Chat - Senior CPA Tax Preparation Tools
// Tax expertise backed by TIE backbone (16,367 lines) + TX01-TX14 engines
// Built by Bobby Don McWilliams II | Echo Omega Prime

import type { Env } from './types';

// ============================================================
// TAX API BASE URL
// ============================================================
const TAX_API_BASE = 'https://echo-tax-return.bmcii1976.workers.dev';

// ============================================================
// TAX SYSTEM PROMPT - Senior CPA-Level Tax Expertise
// ============================================================
export const TAX_SYSTEM_PROMPT = `
--- TAX PREPARATION EXPERT MODE ---
You are a Senior Certified Public Accountant (CPA) and Enrolled Agent (EA) with 30+ years of
professional tax preparation experience. You hold a Master of Science in Taxation and have
represented hundreds of clients before the IRS in audits, appeals, and collections matters.

PROFESSIONAL CREDENTIALS & SPECIALIZATIONS:
- CPA (Texas), Enrolled Agent (IRS), Certified Financial Planner (CFP)
- Former IRS Revenue Agent (8 years), Big 4 tax partner experience
- Board Certified in Tax Law by the Texas Board of Legal Specialization
- Specializations: Oil & Gas taxation, pass-through entities, international tax, estate planning,
  real estate, cryptocurrency/digital assets, self-employment, high-net-worth individuals

KNOWLEDGE ENGINE BACKBONE:
You are backed by Echo Omega Prime's Tax Intelligence Engine (TIE) backbone (16,367 lines of
production code with 50+ doctrine blocks) and 14 specialized tax sub-engines:
  TX01 - Individual Tax Planning (IRC Sec 1-1400Z, itemized vs standard, AMT, NIIT)
  TX02 - Business Entity Selection (C-Corp, S-Corp, LLC, Partnership, Sole Prop)
  TX03 - Oil & Gas Taxation (IDC under IRC 263(c), depletion under IRC 611-613A, working interests, royalties, carried interests)
  TX04 - Self-Employment Tax (Schedule C/SE, estimated payments, home office, vehicle)
  TX05 - Real Estate Taxation (1031 exchanges, passive activity under IRC 469, depreciation, MACRS, cost segregation)
  TX06 - Capital Gains & Investments (short/long-term, wash sales, QOZ, Section 1202 QSBS)
  TX07 - Estate & Gift Tax (unified credit, GSTT, valuation discounts, GRATs, IDGTs, portability)
  TX08 - International Tax (FATCA, FBAR, Subpart F, GILTI, FDII, tax treaties, transfer pricing)
  TX09 - Tax Credits & Incentives (R&D under IRC 41, WOTC, ERC, ITC/PTC for energy, child credits)
  TX10 - Retirement & Benefits (401(k), IRA, Roth conversions, RMDs, SEP, SIMPLE, defined benefit)
  TX11 - Nonprofit & Exempt Organizations (IRC 501(c)(3)-(c)(19), UBIT, lobbying limits, Form 990)
  TX12 - Oil & Gas Advanced (enhanced oil recovery credit, marginal well credit, percentage depletion limits for independent producers)
  TX13 - Partnership Taxation (IRC Subchapter K, substantial economic effect, 704(b) allocations, hot assets under 751, disguised sales under 707)
  TX14 - Cryptocurrency & Digital Assets (Notice 2014-21, virtual currency as property, staking income, DeFi, NFTs, wash sale rules for crypto)

IRS CODE & REGULATION MASTERY:
- Internal Revenue Code (Title 26 USC): Intimate knowledge of all major provisions, able to cite
  specific code sections, subsections, and paragraphs from memory
- Treasury Regulations (26 CFR): Interpretive, legislative, and procedural regulations
- Revenue Rulings, Revenue Procedures, Private Letter Rulings, Technical Advice Memoranda
- Tax Court decisions (regular and memorandum), Circuit Court tax opinions, Supreme Court tax cases
- IRS Publications, Forms, Instructions, and Internal Revenue Manual procedures

TAX PREPARATION CAPABILITIES:
You can prepare and review federal and state returns for:
- Form 1040 (Individual) with ALL schedules (A through SE, plus 8-series)
- Form 1120 (C-Corporation), Form 1120-S (S-Corporation)
- Form 1065 (Partnership), Schedule K-1 analysis and flow-through
- Form 1041 (Estates & Trusts), Form 709 (Gift Tax), Form 706 (Estate Tax)
- Form 990 (Exempt Organizations), Form 5500 (Employee Benefit Plans)
- Multi-state returns and nexus analysis
- International information returns (5471, 5472, 8865, 8858, FinCEN 114)

OIL & GAS TAX EXPERTISE (Commander's core domain):
- Intangible Drilling Costs (IDC): Immediate deduction vs. capitalize under IRC 263(c)
  * Election to expense IDCs in year paid or incurred
  * Recapture rules under IRC 1254 on disposition
  * IDC preference item for AMT under IRC 57(a)(2)
- Depletion: Cost depletion vs. percentage depletion under IRC 611-613A
  * 15% rate for independent producers and royalty owners
  * 65% of taxable income limitation, 100% of net income from property
  * Marginal well production rate adjustments
- Working Interest vs. Royalty Interest tax treatment differences
  * Working interest holders: ordinary income, self-employment tax implications
  * Royalty owners: passive income treatment, portfolio vs. passive characterization
  * Overriding royalty interests (ORRI) carved out vs. retained
- Carried Interests: Promote/carry taxation under IRC 1061 (3-year holding period)
- Section 1031: Like-kind exchange rules for oil & gas properties (post-TCJA)
- Net Profits Interest, Production Payments, Economic Interest
- Form 1099-MISC/NEC for royalty and working interest payments
- Texas franchise tax considerations for oil & gas entities

BEHAVIORAL RULES:
1. When the user discusses tax matters, ALWAYS engage this tax expertise.
2. Cite specific IRC sections, Treasury Regulations, and case law when relevant.
3. Distinguish clearly between DEFENSIBLE positions (backed by statute + case law),
   AGGRESSIVE positions (reasonable but with risk), and DISCLOSURE positions (uncertain, disclose).
4. When preparing returns, collect ALL required information methodically. Do not skip fields.
5. Ask clarifying questions when the user's situation could go multiple ways.
6. Proactively identify tax savings opportunities the user may not have considered.
7. Warn about common audit triggers and red flags.
8. Always note that your advice is informational and users should consult their own CPA for filing.
9. Use the tax tools to create clients, returns, add income/deductions, and calculate results.
10. When the user provides a W-2, 1099, or other document, extract all relevant data points.
11. For Oil & Gas clients, always check for IDC deductions, depletion opportunities, and
    working interest self-employment implications.
12. Track basis meticulously -- cost basis, adjusted basis, depreciable basis, depletion basis.
13. NEVER fabricate code section numbers. If unsure, say "I believe this falls under IRC Section [X],
    but let me verify" and use the search_tax_knowledge tool.

PRICING AWARENESS:
- Basic (1040-EZ equivalent): $97/return
- Standard (1040 + Schedules A/B/C): $297/return
- Premium (complex, K-1s, rental, investments): $597/return
- Oil & Gas Specialist: $997/return
- Business Entity (1120/1120-S/1065): $1,497/return
- Estate & Trust (1041/706/709): $1,997/return
`.trim();

// ============================================================
// TOOL DEFINITIONS - For LLM Function Calling
// ============================================================
export interface TaxToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      required?: boolean;
    }>;
    required: string[];
  };
}

export const TAX_TOOLS: TaxToolDefinition[] = [
  {
    name: 'create_client',
    description: 'Create a new tax client profile in the system. Collects personal information needed for tax preparation including name, SSN, filing status, and contact details.',
    parameters: {
      type: 'object',
      properties: {
        first_name: { type: 'string', description: 'Client first (given) name' },
        middle_name: { type: 'string', description: 'Client middle name or initial (optional)' },
        last_name: { type: 'string', description: 'Client last (family) name' },
        suffix: { type: 'string', description: 'Name suffix (Jr., Sr., III, etc.)', enum: ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'Esq.', 'MD', 'PhD', ''] },
        email: { type: 'string', description: 'Client email address' },
        phone: { type: 'string', description: 'Client phone number' },
        ssn: { type: 'string', description: 'Social Security Number (format: XXX-XX-XXXX). Stored encrypted.' },
        date_of_birth: { type: 'string', description: 'Date of birth (YYYY-MM-DD format)' },
        filing_status: {
          type: 'string',
          description: 'Federal filing status',
          enum: ['single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household', 'qualifying_surviving_spouse'],
        },
        spouse_first_name: { type: 'string', description: 'Spouse first name (if filing jointly or separately)' },
        spouse_last_name: { type: 'string', description: 'Spouse last name (if different)' },
        spouse_ssn: { type: 'string', description: 'Spouse SSN (format: XXX-XX-XXXX). Stored encrypted.' },
        spouse_date_of_birth: { type: 'string', description: 'Spouse date of birth (YYYY-MM-DD)' },
        address_street: { type: 'string', description: 'Street address (line 1)' },
        address_street2: { type: 'string', description: 'Street address line 2 (apt, suite, etc.)' },
        address_city: { type: 'string', description: 'City' },
        address_state: { type: 'string', description: 'State (2-letter abbreviation, e.g., TX)' },
        address_zip: { type: 'string', description: 'ZIP code (5-digit or ZIP+4)' },
        occupation: { type: 'string', description: 'Client occupation/job title' },
        spouse_occupation: { type: 'string', description: 'Spouse occupation/job title' },
        is_blind: { type: 'string', description: 'Whether the client is legally blind', enum: ['true', 'false'] },
        is_65_or_older: { type: 'string', description: 'Whether the client is 65 or older', enum: ['true', 'false'] },
        spouse_is_blind: { type: 'string', description: 'Whether the spouse is legally blind', enum: ['true', 'false'] },
        spouse_is_65_or_older: { type: 'string', description: 'Whether the spouse is 65 or older', enum: ['true', 'false'] },
        can_be_claimed_as_dependent: { type: 'string', description: 'Whether someone else can claim this person as a dependent', enum: ['true', 'false'] },
        notes: { type: 'string', description: 'Additional notes about the client (special situations, preferences)' },
      },
      required: ['first_name', 'last_name', 'email', 'filing_status'],
    },
  },
  {
    name: 'create_return',
    description: 'Start a new tax return for an existing client. Specify the tax year and return type. Returns a return_id that must be used for all subsequent operations on this return.',
    parameters: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'The client ID returned from create_client' },
        tax_year: { type: 'string', description: 'Tax year (e.g., "2025")' },
        return_type: {
          type: 'string',
          description: 'Type of federal return to prepare',
          enum: ['1040', '1040-SR', '1120', '1120-S', '1065', '1041', '706', '709', '990'],
        },
        state_returns: { type: 'string', description: 'Comma-separated list of state abbreviations to prepare state returns for (e.g., "TX,NM,CA")' },
        filing_method: {
          type: 'string',
          description: 'How the return will be filed',
          enum: ['e-file', 'paper', 'extension'],
        },
        prior_year_agi: { type: 'string', description: 'Prior year AGI (needed for e-file identity verification)' },
        estimated_payments_made: { type: 'string', description: 'Total federal estimated tax payments already made for this tax year' },
        withholding_to_date: { type: 'string', description: 'Total federal withholding from all sources year-to-date' },
        notes: { type: 'string', description: 'Special instructions or notes for this return' },
      },
      required: ['client_id', 'tax_year', 'return_type'],
    },
  },
  {
    name: 'add_income',
    description: 'Add an income item to a tax return. Supports all income types: W-2 wages, 1099-NEC (self-employment), 1099-INT (interest), 1099-DIV (dividends), 1099-B (capital gains), 1099-R (retirement), 1099-MISC (royalties/other), rental income, farm income, social security, K-1 income, and more.',
    parameters: {
      type: 'object',
      properties: {
        return_id: { type: 'string', description: 'The return ID from create_return' },
        income_type: {
          type: 'string',
          description: 'Type of income source',
          enum: [
            'w2_wages',
            '1099_nec_self_employment',
            '1099_int_interest',
            '1099_div_dividends',
            '1099_b_capital_gains',
            '1099_r_retirement',
            '1099_misc_royalties',
            '1099_misc_other',
            '1099_g_government',
            '1099_ssa_social_security',
            '1099_k_payment_card',
            'k1_partnership',
            'k1_s_corp',
            'k1_estate_trust',
            'rental_income',
            'farm_income',
            'alimony_received',
            'business_income',
            'gambling_winnings',
            'foreign_income',
            'oil_gas_working_interest',
            'oil_gas_royalty',
            'oil_gas_overriding_royalty',
            'mineral_lease_bonus',
            'other',
          ],
        },
        payer_name: { type: 'string', description: 'Name of the employer, payer, or entity issuing the income' },
        payer_ein: { type: 'string', description: 'Employer Identification Number of the payer (XX-XXXXXXX format)' },
        payer_address: { type: 'string', description: 'Full address of the payer' },
        gross_amount: { type: 'string', description: 'Gross income amount (before any deductions)' },
        federal_tax_withheld: { type: 'string', description: 'Federal income tax withheld from this income source' },
        state_tax_withheld: { type: 'string', description: 'State income tax withheld' },
        state: { type: 'string', description: 'State the income was earned in (2-letter abbreviation)' },
        social_security_wages: { type: 'string', description: 'Social security wages (Box 3 on W-2)' },
        social_security_tax_withheld: { type: 'string', description: 'Social security tax withheld (Box 4 on W-2)' },
        medicare_wages: { type: 'string', description: 'Medicare wages and tips (Box 5 on W-2)' },
        medicare_tax_withheld: { type: 'string', description: 'Medicare tax withheld (Box 6 on W-2)' },
        retirement_plan: { type: 'string', description: 'Whether the employer offers a retirement plan (Box 13 on W-2)', enum: ['true', 'false'] },
        statutory_employee: { type: 'string', description: 'Whether this is a statutory employee (Box 13 on W-2)', enum: ['true', 'false'] },
        qualified_dividends: { type: 'string', description: 'Qualified dividends (1099-DIV Box 1b)' },
        capital_gain_distributions: { type: 'string', description: 'Capital gain distributions (1099-DIV Box 2a)' },
        cost_basis: { type: 'string', description: 'Cost or other basis for 1099-B transactions' },
        date_acquired: { type: 'string', description: 'Date asset was acquired (for capital gains)' },
        date_sold: { type: 'string', description: 'Date asset was sold (for capital gains)' },
        holding_period: { type: 'string', description: 'Short-term or long-term holding period', enum: ['short_term', 'long_term'] },
        tax_exempt_interest: { type: 'string', description: 'Tax-exempt interest (municipal bonds, etc.)' },
        taxable_amount: { type: 'string', description: 'Taxable amount (for retirement distributions, Box 2a on 1099-R)' },
        distribution_code: { type: 'string', description: 'Distribution code from 1099-R (Box 7)' },
        is_total_distribution: { type: 'string', description: 'Whether this is a total distribution', enum: ['true', 'false'] },
        depletion_type: { type: 'string', description: 'Depletion method for oil & gas income', enum: ['cost', 'percentage', 'none'] },
        depletion_amount: { type: 'string', description: 'Depletion deduction amount for oil & gas income' },
        intangible_drilling_costs: { type: 'string', description: 'IDC amount (for oil & gas working interests)' },
        lease_operating_expenses: { type: 'string', description: 'LOE for oil & gas working interests' },
        property_description: { type: 'string', description: 'Description of the oil & gas property or well name' },
        notes: { type: 'string', description: 'Additional notes about this income item' },
      },
      required: ['return_id', 'income_type', 'gross_amount'],
    },
  },
  {
    name: 'add_deduction',
    description: 'Add a deduction or adjustment to a tax return. Supports both above-the-line adjustments (educator expenses, student loan interest, IRA, HSA, self-employment tax deduction, alimony) and below-the-line itemized deductions (medical, state/local taxes, mortgage interest, charitable, casualty).',
    parameters: {
      type: 'object',
      properties: {
        return_id: { type: 'string', description: 'The return ID from create_return' },
        deduction_type: {
          type: 'string',
          description: 'Type of deduction',
          enum: [
            'standard',
            'medical_dental',
            'state_local_income_tax',
            'state_local_sales_tax',
            'real_estate_tax',
            'personal_property_tax',
            'mortgage_interest',
            'mortgage_insurance_premium',
            'charitable_cash',
            'charitable_noncash',
            'charitable_carryover',
            'casualty_theft_loss',
            'unreimbursed_employee_expense',
            'tax_preparation_fees',
            'educator_expense',
            'student_loan_interest',
            'tuition_fees',
            'ira_deduction',
            'traditional_ira',
            'roth_ira_contribution',
            'sep_ira',
            'simple_ira',
            'hsa_deduction',
            'self_employment_tax_deduction',
            'self_employment_health_insurance',
            'alimony_paid',
            'moving_expenses_military',
            'penalty_early_withdrawal',
            'domestic_production_activities',
            'home_office',
            'vehicle_expense',
            'depreciation',
            'section_179',
            'bonus_depreciation',
            'intangible_drilling_costs',
            'depletion',
            'business_expense',
            'rent_expense',
            'utilities_expense',
            'insurance_expense',
            'legal_professional_fees',
            'advertising_expense',
            'travel_expense',
            'meals_expense',
            'office_supplies',
            'contract_labor',
            'wages_paid',
            'other',
          ],
        },
        amount: { type: 'string', description: 'Deduction amount in dollars' },
        description: { type: 'string', description: 'Description of the deduction (payee, purpose, etc.)' },
        recipient_name: { type: 'string', description: 'Name of the recipient (for charitable contributions or alimony)' },
        recipient_ein: { type: 'string', description: 'EIN of the charitable organization' },
        date_paid: { type: 'string', description: 'Date the deduction was paid (YYYY-MM-DD)' },
        is_recurring: { type: 'string', description: 'Whether this is a recurring/monthly deduction', enum: ['true', 'false'] },
        months: { type: 'string', description: 'Number of months if recurring (to calculate annual total)' },
        schedule: {
          type: 'string',
          description: 'Which schedule this deduction belongs on',
          enum: ['schedule_a', 'schedule_c', 'schedule_e', 'schedule_f', 'form_8829', 'adjustment', 'other'],
        },
        property_id: { type: 'string', description: 'Rental property or business ID this deduction applies to' },
        asset_description: { type: 'string', description: 'Description of the asset (for depreciation/Sec 179)' },
        asset_cost: { type: 'string', description: 'Original cost of the asset (for depreciation calculations)' },
        date_placed_in_service: { type: 'string', description: 'Date asset was placed in service (YYYY-MM-DD)' },
        useful_life_years: { type: 'string', description: 'Useful life in years (for depreciation, e.g., 5, 7, 15, 27.5, 39)' },
        depreciation_method: {
          type: 'string',
          description: 'Depreciation method',
          enum: ['straight_line', 'declining_balance_200', 'declining_balance_150', 'macrs_gds', 'macrs_ads', 'section_179', 'bonus_100'],
        },
        irc_section: { type: 'string', description: 'Relevant IRC section (e.g., "179", "263(c)", "611")' },
        notes: { type: 'string', description: 'Additional notes about this deduction' },
      },
      required: ['return_id', 'deduction_type', 'amount'],
    },
  },
  {
    name: 'add_dependent',
    description: 'Add a dependent to a tax return. Includes qualifying child and qualifying relative tests. Captures information needed for child tax credit, earned income credit, dependent care credit, and education credits.',
    parameters: {
      type: 'object',
      properties: {
        return_id: { type: 'string', description: 'The return ID from create_return' },
        first_name: { type: 'string', description: 'Dependent first name' },
        middle_name: { type: 'string', description: 'Dependent middle name or initial' },
        last_name: { type: 'string', description: 'Dependent last name' },
        ssn: { type: 'string', description: 'Dependent SSN or ITIN (stored encrypted)' },
        date_of_birth: { type: 'string', description: 'Dependent date of birth (YYYY-MM-DD)' },
        relationship: {
          type: 'string',
          description: 'Relationship to taxpayer',
          enum: [
            'son', 'daughter', 'stepson', 'stepdaughter', 'foster_child',
            'brother', 'sister', 'half_brother', 'half_sister', 'stepbrother', 'stepsister',
            'grandchild', 'niece', 'nephew', 'parent', 'grandparent',
            'aunt', 'uncle', 'in_law', 'unrelated_member_of_household', 'other',
          ],
        },
        months_lived_with_taxpayer: { type: 'string', description: 'Number of months the dependent lived with the taxpayer during the tax year (0-12)' },
        is_student: { type: 'string', description: 'Whether the dependent was a full-time student during the tax year', enum: ['true', 'false'] },
        is_disabled: { type: 'string', description: 'Whether the dependent is permanently and totally disabled', enum: ['true', 'false'] },
        gross_income: { type: 'string', description: 'Dependent gross income for the year (for qualifying relative test)' },
        child_care_expenses: { type: 'string', description: 'Child/dependent care expenses paid (for Form 2441)' },
        child_care_provider_name: { type: 'string', description: 'Name of child care provider' },
        child_care_provider_ein: { type: 'string', description: 'EIN or SSN of child care provider' },
        education_expenses: { type: 'string', description: 'Qualified education expenses paid (for AOC/LLC)' },
        education_institution: { type: 'string', description: 'Name of educational institution' },
        has_form_1098t: { type: 'string', description: 'Whether a Form 1098-T was received', enum: ['true', 'false'] },
        is_qualifying_child: { type: 'string', description: 'Whether the dependent meets the qualifying child test', enum: ['true', 'false'] },
        eligible_for_child_tax_credit: { type: 'string', description: 'Whether eligible for the Child Tax Credit', enum: ['true', 'false'] },
        notes: { type: 'string', description: 'Additional notes about this dependent' },
      },
      required: ['return_id', 'first_name', 'last_name', 'date_of_birth', 'relationship'],
    },
  },
  {
    name: 'calculate_return',
    description: 'Run the full tax calculation on a return. Computes AGI, taxable income, total tax, credits, payments, and refund or amount owed. Also runs optimization analysis and audit risk scoring.',
    parameters: {
      type: 'object',
      properties: {
        return_id: { type: 'string', description: 'The return ID to calculate' },
        include_state: { type: 'string', description: 'Whether to also calculate state returns', enum: ['true', 'false'] },
        include_optimization: { type: 'string', description: 'Whether to include optimization suggestions', enum: ['true', 'false'] },
        include_audit_risk: { type: 'string', description: 'Whether to include audit risk scoring', enum: ['true', 'false'] },
        compare_filing_statuses: { type: 'string', description: 'Whether to compare outcomes across filing statuses', enum: ['true', 'false'] },
        compare_standard_vs_itemized: { type: 'string', description: 'Whether to compare standard vs itemized deductions', enum: ['true', 'false'] },
      },
      required: ['return_id'],
    },
  },
  {
    name: 'get_return_summary',
    description: 'Get a comprehensive summary of a tax return including all income items, deductions, credits, dependents, tax liability, payments, and refund/balance due. Shows the complete picture of the return.',
    parameters: {
      type: 'object',
      properties: {
        return_id: { type: 'string', description: 'The return ID to summarize' },
        detail_level: {
          type: 'string',
          description: 'Level of detail in the summary',
          enum: ['summary', 'detailed', 'line_by_line'],
        },
        include_schedules: { type: 'string', description: 'Whether to include schedule breakdowns', enum: ['true', 'false'] },
        include_comparison: { type: 'string', description: 'Whether to include prior year comparison', enum: ['true', 'false'] },
      },
      required: ['return_id'],
    },
  },
  {
    name: 'get_optimization',
    description: 'Get AI-powered tax optimization suggestions for a return. Analyzes the return for missed deductions, credit opportunities, filing strategy improvements, timing strategies, and entity structure recommendations. Powered by TIE backbone + TX01-TX14 engines.',
    parameters: {
      type: 'object',
      properties: {
        return_id: { type: 'string', description: 'The return ID to optimize' },
        focus_areas: {
          type: 'string',
          description: 'Comma-separated focus areas for optimization. Leave empty for comprehensive analysis.',
        },
        risk_tolerance: {
          type: 'string',
          description: 'Client risk tolerance for aggressive vs conservative positions',
          enum: ['conservative', 'moderate', 'aggressive'],
        },
        include_entity_restructuring: { type: 'string', description: 'Whether to analyze if a different entity structure would save taxes', enum: ['true', 'false'] },
        include_retirement_planning: { type: 'string', description: 'Whether to include retirement contribution optimization', enum: ['true', 'false'] },
        include_estimated_payments: { type: 'string', description: 'Whether to calculate optimal estimated payment schedule', enum: ['true', 'false'] },
        include_oil_gas_strategies: { type: 'string', description: 'Whether to include oil & gas specific strategies (IDC timing, depletion optimization)', enum: ['true', 'false'] },
      },
      required: ['return_id'],
    },
  },
  {
    name: 'upload_document_url',
    description: 'Get a secure upload URL where the user can upload tax documents (W-2, 1099, receipts, K-1s, etc.). Returns a pre-signed URL and instructions for the user.',
    parameters: {
      type: 'object',
      properties: {
        return_id: { type: 'string', description: 'The return ID this document is associated with' },
        document_type: {
          type: 'string',
          description: 'Type of document being uploaded',
          enum: [
            'w2', '1099_nec', '1099_int', '1099_div', '1099_b', '1099_r', '1099_misc', '1099_g', '1099_ssa', '1099_k',
            'k1_partnership', 'k1_s_corp', 'k1_estate_trust',
            '1098_mortgage', '1098_t_tuition', '1098_e_student_loan',
            'receipt', 'invoice', 'mileage_log', 'home_office_worksheet',
            'charitable_receipt', 'medical_receipt', 'property_tax_statement',
            'prior_year_return', 'extension_form', 'estimated_payment_voucher',
            'oil_gas_revenue_statement', 'joint_interest_billing', 'division_order',
            'other',
          ],
        },
        document_description: { type: 'string', description: 'Brief description of the document' },
      },
      required: ['return_id', 'document_type'],
    },
  },
  {
    name: 'get_pricing',
    description: 'Get the current pricing tiers for tax preparation services. Shows what is included in each tier and helps the user select the right service level for their situation.',
    parameters: {
      type: 'object',
      properties: {
        client_situation: {
          type: 'string',
          description: 'Brief description of the client situation to get a personalized recommendation',
        },
        include_addons: { type: 'string', description: 'Whether to include add-on services pricing', enum: ['true', 'false'] },
      },
      required: [],
    },
  },
  {
    name: 'search_tax_knowledge',
    description: 'Search the Echo Tax Intelligence Engine for authoritative answers on tax law questions. Queries the TIE backbone (16,367 lines of doctrine) and TX01-TX14 sub-engines for IRC code sections, Treasury Regulations, case law, and IRS guidance. Returns doctrine-backed answers with confidence levels and authority citations.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The tax law question or topic to search for' },
        domain: {
          type: 'string',
          description: 'Specific tax domain to focus the search',
          enum: ['individual', 'business', 'oil_gas', 'estate_gift', 'international', 'exempt_org', 'retirement', 'real_estate', 'crypto', 'credits', 'general'],
        },
        mode: {
          type: 'string',
          description: 'Response depth mode',
          enum: ['FAST', 'DEFENSE', 'MEMO'],
        },
        include_authorities: { type: 'string', description: 'Whether to include full authority citations', enum: ['true', 'false'] },
      },
      required: ['query'],
    },
  },
];

// ============================================================
// TAX INTENT DETECTION
// ============================================================

const TAX_KEYWORDS_PRIMARY = [
  'tax', 'taxes', 'taxation', 'taxable', 'tax return', 'tax preparation', 'tax prep',
  'w-2', 'w2', '1099', '1040', '1120', '1065', '1041',
  'schedule c', 'schedule a', 'schedule b', 'schedule d', 'schedule e', 'schedule f', 'schedule k-1', 'schedule se',
  'deduction', 'deductions', 'deductible',
  'refund', 'tax refund',
  'irs', 'internal revenue', 'revenue service',
  'filing', 'file my taxes', 'file taxes', 'e-file', 'efile',
  'income tax', 'income taxes',
  'self-employed', 'self-employment', 'self employed',
  'estimated tax', 'estimated taxes', 'estimated payments', 'quarterly taxes',
  'withholding', 'withheld',
  'agi', 'adjusted gross income',
  'standard deduction', 'itemize', 'itemized',
  'dependent', 'dependents',
  'child tax credit', 'earned income credit', 'eic', 'eitc',
  'capital gains', 'capital gain', 'capital loss',
  'depreciation', 'section 179', 'bonus depreciation', 'macrs',
  'irc', 'internal revenue code',
  'audit', 'irs audit', 'tax audit',
  'penalty', 'penalties', 'interest and penalties',
  'extension', 'file an extension', 'form 4868',
  'amended', 'amended return', 'form 1040-x',
];

const TAX_KEYWORDS_OIL_GAS = [
  'idc', 'intangible drilling', 'intangible drilling costs',
  'depletion', 'percentage depletion', 'cost depletion',
  'working interest', 'royalty interest', 'overriding royalty', 'orri',
  'mineral rights', 'mineral interest',
  'oil and gas tax', 'oil & gas tax',
  'carried interest', 'net profits interest',
  'lease bonus', 'delay rental',
  'section 263', 'section 611', 'section 613',
  'independent producer', 'operator',
  'joint interest billing', 'jib',
  'division order', 'revenue statement',
  'severance tax', 'production tax',
];

const TAX_KEYWORDS_BUSINESS = [
  'business tax', 'corporate tax', 'corporate taxes',
  'llc tax', 's-corp', 's corp', 'c-corp', 'c corp',
  'partnership tax', 'pass-through', 'pass through',
  'k-1', 'k1', 'form k-1',
  'payroll tax', 'payroll taxes',
  'quarterly taxes', 'form 941',
  'business deduction', 'business expense',
  'home office deduction', 'home office',
  'mileage deduction', 'vehicle deduction',
  'qbi', 'qualified business income', 'section 199a',
  'entity selection', 'entity structure',
  'reasonable compensation', 'officer compensation',
];

const TAX_KEYWORDS_SECONDARY = [
  'cpa', 'accountant', 'tax professional', 'tax advisor',
  'form', 'forms', 'tax form',
  'roth', 'ira', '401k', '401(k)', 'sep', 'simple ira',
  'hsa', 'fsa', 'health savings',
  '1031 exchange', 'like-kind exchange',
  'estate tax', 'gift tax', 'inheritance tax',
  'amt', 'alternative minimum tax',
  'niit', 'net investment income',
  'fatca', 'fbar', 'foreign bank account',
  'crypto tax', 'cryptocurrency tax', 'bitcoin tax',
  'rental income', 'rental property',
  'charitable contribution', 'charitable donation',
  'mortgage interest deduction',
  'salt', 'state and local tax',
  'standard deduction vs itemized',
];

const ALL_TAX_KEYWORDS = [
  ...TAX_KEYWORDS_PRIMARY,
  ...TAX_KEYWORDS_OIL_GAS,
  ...TAX_KEYWORDS_BUSINESS,
  ...TAX_KEYWORDS_SECONDARY,
];

export function detectTaxIntent(message: string): boolean {
  const lower = message.toLowerCase();

  // Direct phrase match (high confidence)
  for (const keyword of TAX_KEYWORDS_PRIMARY) {
    if (lower.includes(keyword)) {
      return true;
    }
  }

  // Oil & gas tax keywords (high confidence for Commander's domain)
  for (const keyword of TAX_KEYWORDS_OIL_GAS) {
    if (lower.includes(keyword)) {
      return true;
    }
  }

  // Business tax keywords
  for (const keyword of TAX_KEYWORDS_BUSINESS) {
    if (lower.includes(keyword)) {
      return true;
    }
  }

  // Secondary keywords (need at least 2 matches to trigger)
  let secondaryMatches = 0;
  for (const keyword of TAX_KEYWORDS_SECONDARY) {
    if (lower.includes(keyword)) {
      secondaryMatches++;
      if (secondaryMatches >= 2) {
        return true;
      }
    }
  }

  // Pattern matching for common tax questions
  const taxPatterns = [
    /how (?:much|many|do i|should i|can i).+(?:tax|deduct|write.?off|claim)/i,
    /(?:can|should|do) i (?:deduct|claim|write.?off|depreciate|amortize)/i,
    /what(?:'s| is) (?:the|my) (?:tax|deduction|credit|refund|liability|bracket|rate)/i,
    /(?:file|filing|prepare|preparation).+(?:return|taxes|1040|1120|1065)/i,
    /(?:owe|owing|owed|due|pay|payment).+(?:irs|tax|taxes|federal|state)/i,
    /(?:audit|audited|examination).+(?:irs|tax|return)/i,
    /(?:irc|section|sec\.?|code)\s+\d+/i,
    /form\s+(?:1040|1120|1065|1041|706|709|990|w-?2|1099|k-?1|941|940|8-?\d{3})/i,
    /(?:w-?2|1099|k-?1).+(?:income|wages|interest|dividends|gains)/i,
    /(?:schedule|sch\.?)\s+[a-f]/i,
    /(?:estimated|quarterly)\s+(?:tax|payment)/i,
    /(?:standard|itemized)\s+deduction/i,
    /(?:oil|gas|mineral|royalty|well|drilling).+(?:tax|deduction|depletion|idc|write)/i,
  ];

  for (const pattern of taxPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

// ============================================================
// TOOL EXECUTION ENGINE
// ============================================================

interface TaxToolResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  tool: string;
}

async function fetchTaxApi(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body: Record<string, unknown> | null,
  env: Env,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `${TAX_API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Echo-API-Key': env.ECHO_API_KEY,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timer);

    let data: unknown;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Tax API request to ${endpoint} failed: ${msg}`);
  }
}

function cleanParams(params: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export async function executeTaxTool(
  toolName: string,
  params: Record<string, any>,
  env: Env,
): Promise<TaxToolResult> {
  const clean = cleanParams(params);

  try {
    switch (toolName) {
      case 'create_client': {
        const clientData = {
          first_name: clean.first_name,
          middle_name: clean.middle_name,
          last_name: clean.last_name,
          suffix: clean.suffix,
          email: clean.email,
          phone: clean.phone,
          ssn: clean.ssn,
          date_of_birth: clean.date_of_birth,
          filing_status: clean.filing_status,
          spouse_first_name: clean.spouse_first_name,
          spouse_last_name: clean.spouse_last_name,
          spouse_ssn: clean.spouse_ssn,
          spouse_date_of_birth: clean.spouse_date_of_birth,
          address: {
            street: clean.address_street,
            street2: clean.address_street2,
            city: clean.address_city,
            state: clean.address_state,
            zip: clean.address_zip,
          },
          occupation: clean.occupation,
          spouse_occupation: clean.spouse_occupation,
          is_blind: clean.is_blind === 'true',
          is_65_or_older: clean.is_65_or_older === 'true',
          spouse_is_blind: clean.spouse_is_blind === 'true',
          spouse_is_65_or_older: clean.spouse_is_65_or_older === 'true',
          can_be_claimed_as_dependent: clean.can_be_claimed_as_dependent === 'true',
          notes: clean.notes,
        };

        const result = await fetchTaxApi('/api/clients', 'POST', clientData, env);
        if (!result.ok) {
          return { success: false, error: `Failed to create client (HTTP ${result.status}): ${JSON.stringify(result.data)}`, tool: toolName };
        }
        return { success: true, data: result.data as Record<string, unknown>, tool: toolName };
      }

      case 'create_return': {
        const returnData = {
          client_id: clean.client_id,
          tax_year: parseInt(clean.tax_year, 10),
          return_type: clean.return_type,
          state_returns: clean.state_returns ? clean.state_returns.split(',').map((s: string) => s.trim()) : [],
          filing_method: clean.filing_method ?? 'e-file',
          prior_year_agi: clean.prior_year_agi ? parseFloat(clean.prior_year_agi) : undefined,
          estimated_payments_made: clean.estimated_payments_made ? parseFloat(clean.estimated_payments_made) : 0,
          withholding_to_date: clean.withholding_to_date ? parseFloat(clean.withholding_to_date) : 0,
          notes: clean.notes,
        };

        const result = await fetchTaxApi('/api/returns', 'POST', returnData, env);
        if (!result.ok) {
          return { success: false, error: `Failed to create return (HTTP ${result.status}): ${JSON.stringify(result.data)}`, tool: toolName };
        }
        return { success: true, data: result.data as Record<string, unknown>, tool: toolName };
      }

      case 'add_income': {
        const incomeData = {
          return_id: clean.return_id,
          income_type: clean.income_type,
          payer_name: clean.payer_name,
          payer_ein: clean.payer_ein,
          payer_address: clean.payer_address,
          gross_amount: parseFloat(clean.gross_amount),
          federal_tax_withheld: clean.federal_tax_withheld ? parseFloat(clean.federal_tax_withheld) : 0,
          state_tax_withheld: clean.state_tax_withheld ? parseFloat(clean.state_tax_withheld) : 0,
          state: clean.state,
          // W-2 specific fields
          social_security_wages: clean.social_security_wages ? parseFloat(clean.social_security_wages) : undefined,
          social_security_tax_withheld: clean.social_security_tax_withheld ? parseFloat(clean.social_security_tax_withheld) : undefined,
          medicare_wages: clean.medicare_wages ? parseFloat(clean.medicare_wages) : undefined,
          medicare_tax_withheld: clean.medicare_tax_withheld ? parseFloat(clean.medicare_tax_withheld) : undefined,
          retirement_plan: clean.retirement_plan === 'true',
          statutory_employee: clean.statutory_employee === 'true',
          // Dividend-specific fields
          qualified_dividends: clean.qualified_dividends ? parseFloat(clean.qualified_dividends) : undefined,
          capital_gain_distributions: clean.capital_gain_distributions ? parseFloat(clean.capital_gain_distributions) : undefined,
          // Capital gains fields
          cost_basis: clean.cost_basis ? parseFloat(clean.cost_basis) : undefined,
          date_acquired: clean.date_acquired,
          date_sold: clean.date_sold,
          holding_period: clean.holding_period,
          // Tax-exempt interest
          tax_exempt_interest: clean.tax_exempt_interest ? parseFloat(clean.tax_exempt_interest) : undefined,
          // Retirement distribution fields
          taxable_amount: clean.taxable_amount ? parseFloat(clean.taxable_amount) : undefined,
          distribution_code: clean.distribution_code,
          is_total_distribution: clean.is_total_distribution === 'true',
          // Oil & gas specific fields
          depletion_type: clean.depletion_type,
          depletion_amount: clean.depletion_amount ? parseFloat(clean.depletion_amount) : undefined,
          intangible_drilling_costs: clean.intangible_drilling_costs ? parseFloat(clean.intangible_drilling_costs) : undefined,
          lease_operating_expenses: clean.lease_operating_expenses ? parseFloat(clean.lease_operating_expenses) : undefined,
          property_description: clean.property_description,
          notes: clean.notes,
        };

        const result = await fetchTaxApi(`/api/returns/${clean.return_id}/income`, 'POST', incomeData, env);
        if (!result.ok) {
          return { success: false, error: `Failed to add income (HTTP ${result.status}): ${JSON.stringify(result.data)}`, tool: toolName };
        }
        return { success: true, data: result.data as Record<string, unknown>, tool: toolName };
      }

      case 'add_deduction': {
        const deductionData = {
          return_id: clean.return_id,
          deduction_type: clean.deduction_type,
          amount: parseFloat(clean.amount),
          description: clean.description,
          recipient_name: clean.recipient_name,
          recipient_ein: clean.recipient_ein,
          date_paid: clean.date_paid,
          is_recurring: clean.is_recurring === 'true',
          months: clean.months ? parseInt(clean.months, 10) : undefined,
          schedule: clean.schedule,
          property_id: clean.property_id,
          asset_description: clean.asset_description,
          asset_cost: clean.asset_cost ? parseFloat(clean.asset_cost) : undefined,
          date_placed_in_service: clean.date_placed_in_service,
          useful_life_years: clean.useful_life_years ? parseInt(clean.useful_life_years, 10) : undefined,
          depreciation_method: clean.depreciation_method,
          irc_section: clean.irc_section,
          notes: clean.notes,
        };

        const result = await fetchTaxApi(`/api/returns/${clean.return_id}/deductions`, 'POST', deductionData, env);
        if (!result.ok) {
          return { success: false, error: `Failed to add deduction (HTTP ${result.status}): ${JSON.stringify(result.data)}`, tool: toolName };
        }
        return { success: true, data: result.data as Record<string, unknown>, tool: toolName };
      }

      case 'add_dependent': {
        const dependentData = {
          return_id: clean.return_id,
          first_name: clean.first_name,
          middle_name: clean.middle_name,
          last_name: clean.last_name,
          ssn: clean.ssn,
          date_of_birth: clean.date_of_birth,
          relationship: clean.relationship,
          months_lived_with_taxpayer: clean.months_lived_with_taxpayer ? parseInt(clean.months_lived_with_taxpayer, 10) : 12,
          is_student: clean.is_student === 'true',
          is_disabled: clean.is_disabled === 'true',
          gross_income: clean.gross_income ? parseFloat(clean.gross_income) : 0,
          child_care_expenses: clean.child_care_expenses ? parseFloat(clean.child_care_expenses) : undefined,
          child_care_provider_name: clean.child_care_provider_name,
          child_care_provider_ein: clean.child_care_provider_ein,
          education_expenses: clean.education_expenses ? parseFloat(clean.education_expenses) : undefined,
          education_institution: clean.education_institution,
          has_form_1098t: clean.has_form_1098t === 'true',
          is_qualifying_child: clean.is_qualifying_child === 'true',
          eligible_for_child_tax_credit: clean.eligible_for_child_tax_credit === 'true',
          notes: clean.notes,
        };

        const result = await fetchTaxApi(`/api/returns/${clean.return_id}/dependents`, 'POST', dependentData, env);
        if (!result.ok) {
          return { success: false, error: `Failed to add dependent (HTTP ${result.status}): ${JSON.stringify(result.data)}`, tool: toolName };
        }
        return { success: true, data: result.data as Record<string, unknown>, tool: toolName };
      }

      case 'calculate_return': {
        const calcParams = {
          include_state: clean.include_state === 'true',
          include_optimization: clean.include_optimization !== 'false',
          include_audit_risk: clean.include_audit_risk !== 'false',
          compare_filing_statuses: clean.compare_filing_statuses === 'true',
          compare_standard_vs_itemized: clean.compare_standard_vs_itemized === 'true',
        };

        const result = await fetchTaxApi(`/api/returns/${clean.return_id}/calculate`, 'POST', calcParams, env);
        if (!result.ok) {
          return { success: false, error: `Failed to calculate return (HTTP ${result.status}): ${JSON.stringify(result.data)}`, tool: toolName };
        }
        return { success: true, data: result.data as Record<string, unknown>, tool: toolName };
      }

      case 'get_return_summary': {
        const queryParams = new URLSearchParams();
        if (clean.detail_level) queryParams.set('detail', clean.detail_level);
        if (clean.include_schedules === 'true') queryParams.set('schedules', 'true');
        if (clean.include_comparison === 'true') queryParams.set('comparison', 'true');
        const qs = queryParams.toString();
        const endpoint = `/api/returns/${clean.return_id}/summary${qs ? '?' + qs : ''}`;

        const result = await fetchTaxApi(endpoint, 'GET', null, env);
        if (!result.ok) {
          return { success: false, error: `Failed to get return summary (HTTP ${result.status}): ${JSON.stringify(result.data)}`, tool: toolName };
        }
        return { success: true, data: result.data as Record<string, unknown>, tool: toolName };
      }

      case 'get_optimization': {
        const optParams = {
          focus_areas: clean.focus_areas ? clean.focus_areas.split(',').map((s: string) => s.trim()) : [],
          risk_tolerance: clean.risk_tolerance ?? 'moderate',
          include_entity_restructuring: clean.include_entity_restructuring === 'true',
          include_retirement_planning: clean.include_retirement_planning === 'true',
          include_estimated_payments: clean.include_estimated_payments === 'true',
          include_oil_gas_strategies: clean.include_oil_gas_strategies === 'true',
        };

        const result = await fetchTaxApi(`/api/returns/${clean.return_id}/optimize`, 'POST', optParams, env);
        if (!result.ok) {
          return { success: false, error: `Failed to get optimization (HTTP ${result.status}): ${JSON.stringify(result.data)}`, tool: toolName };
        }
        return { success: true, data: result.data as Record<string, unknown>, tool: toolName };
      }

      case 'upload_document_url': {
        const docParams = {
          return_id: clean.return_id,
          document_type: clean.document_type,
          description: clean.document_description,
        };

        const result = await fetchTaxApi(`/api/returns/${clean.return_id}/documents/upload-url`, 'POST', docParams, env);
        if (!result.ok) {
          return { success: false, error: `Failed to get upload URL (HTTP ${result.status}): ${JSON.stringify(result.data)}`, tool: toolName };
        }
        return { success: true, data: result.data as Record<string, unknown>, tool: toolName };
      }

      case 'get_pricing': {
        const queryParams = new URLSearchParams();
        if (clean.client_situation) queryParams.set('situation', clean.client_situation);
        if (clean.include_addons === 'true') queryParams.set('addons', 'true');
        const qs = queryParams.toString();
        const endpoint = `/api/pricing${qs ? '?' + qs : ''}`;

        const result = await fetchTaxApi(endpoint, 'GET', null, env);
        if (!result.ok) {
          // Fallback to hardcoded pricing if API is unavailable
          return {
            success: true,
            data: {
              tiers: [
                {
                  name: 'Basic',
                  price: 97,
                  description: 'Simple individual return (1040-EZ equivalent)',
                  includes: ['Federal Form 1040', 'Standard deduction', 'W-2 income only', 'Up to 2 dependents', 'E-file + direct deposit'],
                },
                {
                  name: 'Standard',
                  price: 297,
                  description: 'Individual return with schedules',
                  includes: ['Federal Form 1040 + all schedules', 'Itemized deductions (Schedule A)', 'Self-employment (Schedule C)', '1099 income', 'Unlimited dependents', 'State return (1 state)', 'Prior year comparison', 'E-file + direct deposit'],
                },
                {
                  name: 'Premium',
                  price: 597,
                  description: 'Complex individual return',
                  includes: ['Everything in Standard', 'K-1 income (partnership/S-corp)', 'Rental property (Schedule E)', 'Investment income (Schedule D)', 'Multi-state returns (up to 3)', 'AMT calculation', 'Audit risk analysis', 'Tax optimization report'],
                },
                {
                  name: 'Oil & Gas Specialist',
                  price: 997,
                  description: 'Specialized for oil & gas professionals',
                  includes: ['Everything in Premium', 'Working interest income', 'Royalty income analysis', 'IDC deduction optimization', 'Depletion calculation (cost + percentage)', 'Mineral rights valuation', 'JIB/revenue statement reconciliation', 'Multi-state oil & gas nexus', 'Section 1031 exchange analysis'],
                },
                {
                  name: 'Business Entity',
                  price: 1497,
                  description: 'Corporation, S-Corp, or Partnership returns',
                  includes: ['Form 1120, 1120-S, or 1065', 'K-1 preparation for all partners/shareholders', 'Officer/partner compensation analysis', 'QBI deduction calculation', 'Entity structure optimization', 'Estimated payment schedule', 'State returns (up to 5 states)', 'Audit defense support (1 year)'],
                },
                {
                  name: 'Estate & Trust',
                  price: 1997,
                  description: 'Estate, gift, and trust returns',
                  includes: ['Form 1041 (Estate/Trust)', 'Form 706 (Estate Tax)', 'Form 709 (Gift Tax)', 'Beneficiary K-1 preparation', 'Estate valuation review', 'Portability election', 'GSTT analysis', 'Trust distribution planning'],
                },
              ],
              addons: [
                { name: 'Additional state return', price: 75 },
                { name: 'Amended return (1040-X)', price: 150 },
                { name: 'IRS notice response', price: 200 },
                { name: 'Audit representation (hourly)', price: 350 },
                { name: 'Tax planning consultation (1 hour)', price: 250 },
                { name: 'FBAR/FATCA filing', price: 200 },
                { name: 'Crypto transaction reconciliation (per 100 txns)', price: 150 },
                { name: 'Cost segregation study coordination', price: 500 },
                { name: 'Entity restructuring analysis', price: 750 },
                { name: 'Prior year return (per year)', price: 350 },
              ],
              recommendation: clean.client_situation
                ? `Based on your situation, I recommend reviewing the details to determine the best tier. Describe your income sources and I can give a precise recommendation.`
                : undefined,
            },
            tool: toolName,
          };
        }
        return { success: true, data: result.data as Record<string, unknown>, tool: toolName };
      }

      case 'search_tax_knowledge': {
        // Route to the Engine Runtime's tax-specific search
        const searchParams = new URLSearchParams({
          q: clean.query,
          limit: '5',
        });
        if (clean.domain) searchParams.set('category', `TAX_${clean.domain.toUpperCase()}`);
        if (clean.mode) searchParams.set('mode', clean.mode);

        const engineUrl = `https://echo-engine-runtime.bmcii1976.workers.dev/search?${searchParams}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        try {
          const response = await fetch(engineUrl, {
            headers: {
              'X-Echo-API-Key': env.ECHO_API_KEY,
            },
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (!response.ok) {
            const text = await response.text();
            return { success: false, error: `Engine Runtime search failed (HTTP ${response.status}): ${text.slice(0, 300)}`, tool: toolName };
          }

          const data = await response.json() as Record<string, unknown>;
          return { success: true, data, tool: toolName };
        } catch (err) {
          clearTimeout(timer);

          // Fallback: try the tax API's own knowledge endpoint
          try {
            const fallbackResult = await fetchTaxApi(
              `/api/knowledge/search?q=${encodeURIComponent(clean.query)}&domain=${clean.domain ?? 'general'}&mode=${clean.mode ?? 'FAST'}`,
              'GET',
              null,
              env,
            );
            if (fallbackResult.ok) {
              return { success: true, data: fallbackResult.data as Record<string, unknown>, tool: toolName };
            }
          } catch {
            // Both failed
          }

          const msg = err instanceof Error ? err.message : String(err);
          return { success: false, error: `Tax knowledge search failed: ${msg}`, tool: toolName };
        }
      }

      default:
        return { success: false, error: `Unknown tax tool: ${toolName}`, tool: toolName };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Tax tool execution error (${toolName}): ${msg}`, tool: toolName };
  }
}
