import { z } from "zod";

// Validação para atleta
export const athleteSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos"),
  
  email: z.string()
    .email("Email inválido")
    .max(255, "Email muito longo")
    .optional()
    .or(z.literal("")),
  
  city: z.string()
    .trim()
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(100, "Cidade muito longa"),
  
  instagram: z.string()
    .regex(/^@?[a-zA-Z0-9._]+$/, "Instagram inválido")
    .max(30, "Instagram muito longo")
    .optional()
    .or(z.literal("")),
  
  category: z.union([
    z.literal("Iniciante"),
    z.literal("D"),
    z.literal("C")
  ]),
  
  gender: z.union([
    z.literal("Masculino"),
    z.literal("Feminino")
  ]),
  
  points: z.number()
    .min(0, "Pontos não podem ser negativos")
    .max(10000, "Pontos muito altos")
    .default(0)
});

export type AthleteInput = z.infer<typeof athleteSchema>;

// Validação para torneio
export const tournamentSchema = z.object({
  name: z.string()
    .trim()
    .min(3, "Nome do torneio deve ter pelo menos 3 caracteres")
    .max(150, "Nome do torneio muito longo"),
  
  description: z.string()
    .trim()
    .max(500, "Descrição muito longa")
    .optional()
    .or(z.literal("")),
  
  location: z.string()
    .trim()
    .min(3, "Local deve ter pelo menos 3 caracteres")
    .max(150, "Local muito longo"),
  
  date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Data inválida"),
  
  category: z.union([
    z.literal("Iniciante"),
    z.literal("D"),
    z.literal("C")
  ]),
  
  whatsapp: z.string()
    .regex(/^https:\/\/wa\.me\/\d+|^$/, "WhatsApp deve ser um link válido (https://wa.me/...)")
    .optional()
    .or(z.literal(""))
});

export type TournamentInput = z.infer<typeof tournamentSchema>;

// Validação para achievement
export const achievementSchema = z.object({
  athlete_id: z.string()
    .uuid("ID do atleta inválido"),
  
  tournament_name: z.string()
    .trim()
    .min(3, "Nome do torneio deve ter pelo menos 3 caracteres")
    .max(150, "Nome do torneio muito longo"),
  
  position: z.number()
    .int("Posição deve ser um número inteiro")
    .min(1, "Posição mínima é 1")
    .max(100, "Posição máxima é 100"),
  
  points_awarded: z.number()
    .int("Pontos devem ser um número inteiro")
    .min(0, "Pontos não podem ser negativos")
    .max(1000, "Pontos muito altos"),
  
  date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Data inválida")
});

export type AchievementInput = z.infer<typeof achievementSchema>;
