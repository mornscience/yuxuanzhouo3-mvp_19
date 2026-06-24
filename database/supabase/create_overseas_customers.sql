-- =========================================================
-- 创建海外客户表 overseas_customers
-- =========================================================
CREATE TABLE IF NOT EXISTS public.overseas_customers (
  id VARCHAR(50) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  company_name_en VARCHAR(255),
  industry VARCHAR(100),
  sub_industry VARCHAR(100),
  location VARCHAR(255),
  country VARCHAR(100),
  city VARCHAR(100),
  contact_person VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  business_type VARCHAR(50),
  annual_revenue VARCHAR(50),
  employee_count VARCHAR(50),
  founded_year INTEGER,
  product_categories TEXT,
  certifications TEXT,
  description TEXT,
  source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_overseas_customers_email ON public.overseas_customers(email);
CREATE INDEX IF NOT EXISTS idx_overseas_customers_company_name ON public.overseas_customers(company_name);
CREATE INDEX IF NOT EXISTS idx_overseas_customers_created_at ON public.overseas_customers(created_at DESC);

-- 创建存储过程用于动态创建表
CREATE OR REPLACE FUNCTION public.create_overseas_customers_table() 
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'overseas_customers') THEN
    CREATE TABLE public.overseas_customers (
      id VARCHAR(50) PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      company_name_en VARCHAR(255),
      industry VARCHAR(100),
      sub_industry VARCHAR(100),
      location VARCHAR(255),
      country VARCHAR(100),
      city VARCHAR(100),
      contact_person VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      website VARCHAR(255),
      business_type VARCHAR(50),
      annual_revenue VARCHAR(50),
      employee_count VARCHAR(50),
      founded_year INTEGER,
      product_categories TEXT,
      certifications TEXT,
      description TEXT,
      source VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_overseas_customers_email ON public.overseas_customers(email);
    CREATE INDEX idx_overseas_customers_company_name ON public.overseas_customers(company_name);
    CREATE INDEX idx_overseas_customers_created_at ON public.overseas_customers(created_at DESC);
  END IF;
END;
$$ LANGUAGE plpgsql;