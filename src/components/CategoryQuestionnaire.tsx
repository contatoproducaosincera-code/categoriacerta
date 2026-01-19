import { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, ArrowLeft, Trophy, Target, Clock, Dumbbell, Award } from 'lucide-react';

export interface QuestionnaireResponses {
  playedTournaments: 'never' | 'few' | 'many';
  knowsFundamentals: 'no' | 'basic' | 'advanced';
  gameVolume: 'none' | 'low' | 'good' | 'high';
  hasTechnique: 'none' | 'basic' | 'good' | 'advanced';
  tookLessons: 'never' | 'past' | 'current';
  playingTime: 'less_4_months' | '4_to_6_months' | 'more_6_months';
  hasPodiums: 'no' | 'few' | 'many';
}

export type SuggestedCategory = 'Iniciante' | 'D' | 'C';

interface Question {
  id: keyof QuestionnaireResponses;
  icon: React.ReactNode;
  question: string;
  options: { value: string; label: string; description?: string }[];
}

const questions: Question[] = [
  {
    id: 'playedTournaments',
    icon: <Trophy className="h-5 w-5" />,
    question: 'Você já participou de torneios de Beach Tennis?',
    options: [
      { value: 'never', label: 'Nunca participei', description: 'Ainda não joguei torneios' },
      { value: 'few', label: 'Já participei de alguns', description: 'Entre 1 e 5 torneios' },
      { value: 'many', label: 'Participo frequentemente', description: 'Mais de 5 torneios' },
    ],
  },
  {
    id: 'knowsFundamentals',
    icon: <Target className="h-5 w-5" />,
    question: 'Qual seu nível nos fundamentos básicos? (saque, smash, curtas)',
    options: [
      { value: 'no', label: 'Não conheço bem', description: 'Ainda estou aprendendo' },
      { value: 'basic', label: 'Conheço e executo o básico', description: 'Consigo fazer, mas com dificuldade' },
      { value: 'advanced', label: 'Executo com facilidade', description: 'Domino todos os fundamentos' },
    ],
  },
  {
    id: 'gameVolume',
    icon: <Dumbbell className="h-5 w-5" />,
    question: 'Como é seu volume de jogo?',
    options: [
      { value: 'none', label: 'Não tenho volume', description: 'Jogo raramente ou estou começando' },
      { value: 'low', label: 'Baixo volume', description: 'Jogo 1-2 vezes por semana' },
      { value: 'good', label: 'Bom volume', description: 'Jogo 3+ vezes por semana' },
      { value: 'high', label: 'Alto volume', description: 'Jogo quase todos os dias' },
    ],
  },
  {
    id: 'hasTechnique',
    icon: <Target className="h-5 w-5" />,
    question: 'Como você avalia sua técnica?',
    options: [
      { value: 'none', label: 'Não tenho técnica', description: 'Estou aprendendo os movimentos' },
      { value: 'basic', label: 'Técnica básica', description: 'Consigo executar os golpes' },
      { value: 'good', label: 'Boa técnica', description: 'Executo bem a maioria dos golpes' },
      { value: 'advanced', label: 'Técnica apurada', description: 'Domino todos os golpes com precisão' },
    ],
  },
  {
    id: 'tookLessons',
    icon: <Award className="h-5 w-5" />,
    question: 'Você já fez ou faz aulas de Beach Tennis?',
    options: [
      { value: 'never', label: 'Nunca fiz aulas', description: 'Aprendi sozinho ou com amigos' },
      { value: 'past', label: 'Já fiz aulas', description: 'Tive acompanhamento no passado' },
      { value: 'current', label: 'Faço aulas atualmente', description: 'Tenho acompanhamento regular' },
    ],
  },
  {
    id: 'playingTime',
    icon: <Clock className="h-5 w-5" />,
    question: 'Há quanto tempo você joga Beach Tennis?',
    options: [
      { value: 'less_4_months', label: 'Menos de 4 meses', description: 'Comecei recentemente' },
      { value: '4_to_6_months', label: 'Entre 4 e 6 meses', description: 'Já tenho alguma experiência' },
      { value: 'more_6_months', label: 'Mais de 6 meses', description: 'Jogo há bastante tempo' },
    ],
  },
  {
    id: 'hasPodiums',
    icon: <Trophy className="h-5 w-5" />,
    question: 'Você já conquistou pódios em torneios?',
    options: [
      { value: 'no', label: 'Nunca subi ao pódio', description: 'Ainda não conquistei' },
      { value: 'few', label: 'Alguns pódios', description: '1 a 3 pódios' },
      { value: 'many', label: 'Vários pódios', description: 'Mais de 3 pódios' },
    ],
  },
];

// Scoring system
const scoreMap: Record<keyof QuestionnaireResponses, Record<string, number>> = {
  playedTournaments: { never: 0, few: 2, many: 4 },
  knowsFundamentals: { no: 0, basic: 2, advanced: 4 },
  gameVolume: { none: 0, low: 1, good: 3, high: 4 },
  hasTechnique: { none: 0, basic: 1, good: 3, advanced: 4 },
  tookLessons: { never: 0, past: 2, current: 3 },
  playingTime: { less_4_months: 0, '4_to_6_months': 2, more_6_months: 4 },
  hasPodiums: { no: 0, few: 3, many: 5 },
};

export const calculateCategory = (responses: QuestionnaireResponses): SuggestedCategory => {
  let totalScore = 0;

  for (const [key, value] of Object.entries(responses)) {
    const questionKey = key as keyof QuestionnaireResponses;
    totalScore += scoreMap[questionKey][value] || 0;
  }

  // Category thresholds
  // Max possible score: 4 + 4 + 4 + 4 + 3 + 4 + 5 = 28
  // Iniciante: 0-8 (beginner indicators)
  // D: 9-18 (intermediate indicators)
  // C: 19+ (advanced indicators)
  
  if (totalScore <= 8) {
    return 'Iniciante';
  } else if (totalScore <= 18) {
    return 'D';
  } else {
    return 'C';
  }
};

interface CategoryQuestionnaireProps {
  onComplete: (responses: QuestionnaireResponses, suggestedCategory: SuggestedCategory) => void;
  onBack?: () => void;
}

const CategoryQuestionnaire = memo(({ onComplete, onBack }: CategoryQuestionnaireProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Partial<QuestionnaireResponses>>({});
  const [showResult, setShowResult] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<SuggestedCategory | null>(null);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleSelect = useCallback((value: string) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }, [currentQuestion.id]);

  const handleNext = useCallback(() => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Calculate category
      const fullResponses = responses as QuestionnaireResponses;
      const category = calculateCategory(fullResponses);
      setSuggestedCategory(category);
      setShowResult(true);
    }
  }, [currentStep, responses]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  }, [currentStep, onBack]);

  const handleConfirm = useCallback(() => {
    if (suggestedCategory) {
      onComplete(responses as QuestionnaireResponses, suggestedCategory);
    }
  }, [responses, suggestedCategory, onComplete]);

  const currentValue = responses[currentQuestion?.id];
  const canProceed = !!currentValue;

  // Result screen
  if (showResult && suggestedCategory) {
    const categoryColors = {
      Iniciante: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      D: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      C: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    };

    const categoryDescriptions = {
      Iniciante: 'Você está começando sua jornada no Beach Tennis. Esta categoria é perfeita para desenvolver seus fundamentos e ganhar experiência.',
      D: 'Você já tem uma boa base no Beach Tennis. Esta categoria é ideal para aprimorar sua técnica e buscar seus primeiros pódios.',
      C: 'Você demonstra experiência e habilidade no Beach Tennis. Esta categoria reúne atletas com técnica apurada e histórico competitivo.',
    };

    return (
      <Card className="border-2">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Avaliação Concluída!</CardTitle>
          <CardDescription>
            Com base nas suas respostas, identificamos sua categoria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Sua categoria sugerida é:</p>
            <Badge 
              variant="outline" 
              className={`text-2xl px-6 py-3 font-bold ${categoryColors[suggestedCategory]}`}
            >
              Categoria {suggestedCategory}
            </Badge>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {categoryDescriptions[suggestedCategory]}
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
              ⚠️ Esta classificação é uma sugestão automática e pode ser ajustada após avaliação.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowResult(false);
                setCurrentStep(0);
                setResponses({});
              }}
            >
              Refazer
            </Button>
            <Button className="flex-1 gap-2" onClick={handleConfirm}>
              Confirmar e Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs">
            Pergunta {currentStep + 1} de {questions.length}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ~{questions.length - currentStep} min restantes
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            {currentQuestion.icon}
            <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          </div>
        </div>

        <RadioGroup
          value={currentValue || ''}
          onValueChange={handleSelect}
          className="space-y-3"
        >
          {currentQuestion.options.map((option) => (
            <Label
              key={option.value}
              htmlFor={option.value}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                currentValue === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
              <div className="space-y-1">
                <span className="font-medium">{option.label}</span>
                {option.description && (
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                )}
              </div>
            </Label>
          ))}
        </RadioGroup>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handlePrev}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 0 ? 'Voltar' : 'Anterior'}
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleNext}
            disabled={!canProceed}
          >
            {currentStep === questions.length - 1 ? 'Ver Resultado' : 'Próxima'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

CategoryQuestionnaire.displayName = 'CategoryQuestionnaire';

export default CategoryQuestionnaire;
