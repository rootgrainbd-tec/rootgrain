-- Reconcile Order schema drift: restore canonical column names with fail-closed preconditions and zero data loss
DO $$
DECLARE
  v_order_count INT;
  v_prod_state_drift_count INT;
  v_deadline_drift_count INT;
  v_mfg_days_drift_count INT;
BEGIN
  -- 1. Precondition Check: Table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Order'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Table public."Order" does not exist';
  END IF;

  -- 2. Precondition Check: Target canonical columns must NOT already exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'productionState'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Column "Order.productionState" already exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'advanceDeadline'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Column "Order.advanceDeadline" already exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'estimatedManufacturingDays'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Column "Order.estimatedManufacturingDays" already exists';
  END IF;

  -- 3. Precondition Check: Source drift columns MUST exist with expected types
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Order' 
      AND column_name = 'productionState_drift' 
      AND udt_name = 'ProductionState'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Source column "Order.productionState_drift" with type ProductionState is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Order' 
      AND column_name = 'advanceDeadline_drift' 
      AND udt_name = 'timestamp'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Source column "Order.advanceDeadline_drift" with type timestamp is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Order' 
      AND column_name = 'estimatedManufacturingDays_drift' 
      AND udt_name = 'int4'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Source column "Order.estimatedManufacturingDays_drift" with type int4 is missing';
  END IF;

  -- 4. Data Safety Baseline Assertions
  SELECT 
    count(*),
    count("productionState_drift"),
    count("advanceDeadline_drift"),
    count("estimatedManufacturingDays_drift")
  INTO 
    v_order_count,
    v_prod_state_drift_count,
    v_deadline_drift_count,
    v_mfg_days_drift_count
  FROM "Order";

  IF v_order_count <> 49 THEN
    RAISE EXCEPTION 'Data Safety Check Failed: Expected 49 orders, found %', v_order_count;
  END IF;

  IF v_prod_state_drift_count <> 49 THEN
    RAISE EXCEPTION 'Data Safety Check Failed: Expected 49 non-null productionState_drift values, found %', v_prod_state_drift_count;
  END IF;

  IF v_deadline_drift_count <> 6 THEN
    RAISE EXCEPTION 'Data Safety Check Failed: Expected 6 non-null advanceDeadline_drift values, found %', v_deadline_drift_count;
  END IF;

  IF v_mfg_days_drift_count <> 0 THEN
    RAISE EXCEPTION 'Data Safety Check Failed: Expected 0 non-null estimatedManufacturingDays_drift values, found %', v_mfg_days_drift_count;
  END IF;

  -- 5. Atomic In-Place Reconciliations (Preserving 100% of data values)
  ALTER TABLE "Order" RENAME COLUMN "productionState_drift" TO "productionState";
  ALTER TABLE "Order" RENAME COLUMN "advanceDeadline_drift" TO "advanceDeadline";
  ALTER TABLE "Order" RENAME COLUMN "estimatedManufacturingDays_drift" TO "estimatedManufacturingDays";

END $$;
