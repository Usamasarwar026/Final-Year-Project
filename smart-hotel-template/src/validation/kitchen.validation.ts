import * as yup from "yup";

export const createCategorySchema = yup.object({
  name: yup
    .string()
    .required("Category name is required"),
});

export const createFoodItemSchema = yup.object({
  name: yup
    .string()
    .required("Food name is required"),

  category_id: yup
    .number()
    .required(),

  price: yup
    .number()
    .positive()
    .required(),

  preparation_time_minutes: yup
    .number()
    .positive()
    .required(),
});

export const createOrderSchema = yup.object({
  customer_name: yup
    .string()
    .required(),

  order_type: yup
    .string()
    .required(),

  items: yup
    .array()
    .min(1)
    .required(),
});