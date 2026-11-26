import { Link } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { http, errorMessage } from '../../lib/http'

type Quiz = { id: number; title: string; description: string | null; questions_count?: number; questions?: { id: number; statement: string; options: { id: number; text: string }[] }[] }
type Attempt = { id: number; quiz_id: number; total_questions: number; correct_count: number; completed_at: string | null; quiz?: { title: string }; answers?: { question_id: number; statement: string; explanation: string | null; selected_option: string; is_correct: boolean }[] }
type Page<T> = { data: T[] }

export function QuizListPage() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['quizzes', 'list'], queryFn: async ({ signal }) => (await http.get<Page<Quiz>>('/quizzes', { signal })).data.data })
  return <div className="dashboard"><p className="eyebrow">Aprendizagem</p><h1>Quizzes</h1><p>Responda a perguntas por tema e veja o resultado desta tentativa.</p>{isPending ? <div className="skeleton skeleton-row" role="status">A carregar…</div> : isError ? <div className="state-panel"><p>Não foi possível carregar os quizzes.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : data.length === 0 ? <div className="state-panel"><p>Ainda não há quizzes publicados.</p></div> : <div className="dashboard-links">{data.map(quiz => <Link key={quiz.id} to="/app/quizzes/$id" params={{ id: String(quiz.id) }} className="topic-card"><span className="pill">{quiz.questions_count ?? 0} perguntas</span><h2>{quiz.title}</h2><p>{quiz.description}</p><span className="card-link">Começar quiz</span></Link>)}</div>}</div>
}

export function QuizPlayPage({ id }: { id: string }) {
  const [position, setPosition] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const { data: quiz, isPending, isError, refetch } = useQuery({ queryKey: ['quizzes', 'detail', id], queryFn: async ({ signal }) => (await http.get<{ data: Quiz }>(`/quizzes/${id}`, { signal })).data.data })
  const attempt = useMutation({ mutationFn: async () => (await http.post<{ data: Attempt }>(`/quizzes/${id}/attempts`, { answers: Object.entries(answers).map(([question_id, option_id]) => ({ question_id: Number(question_id), option_id })) })).data.data })
  if (isPending) return <div className="state-panel" role="status">A carregar quiz…</div>
  if (isError) return <div className="state-panel"><p>Não foi possível abrir o quiz.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div>
  const questions = quiz.questions || []
  const question = questions[position]
  if (attempt.data) return <div className="quiz-screen"><p className="eyebrow">Resultado da tentativa</p><h1>{quiz.title}</h1><p className="quiz-result">{attempt.data.correct_count} de {attempt.data.total_questions} respostas correctas</p><div className="answer-review">{attempt.data.answers?.map(answer => <article key={answer.question_id} className="editor-panel"><h2>{answer.statement}</h2><p>{answer.is_correct ? 'Resposta correcta' : 'Resposta incorrecta'}: {answer.selected_option}</p>{answer.explanation && <p>{answer.explanation}</p>}</article>)}</div><Link to="/app/quizzes" className="button">Voltar aos quizzes</Link></div>
  if (!question) return <div className="state-panel"><h1>Quiz sem perguntas</h1><Link to="/app/quizzes" className="button">Voltar</Link></div>
  return <div className="quiz-screen"><Link to="/app/quizzes" className="text-link">Voltar aos quizzes</Link><p className="eyebrow">Pergunta {position + 1} de {questions.length}</p><h1>{quiz.title}</h1><div className="quiz-progress" role="progressbar" aria-valuenow={position + 1} aria-valuemin={1} aria-valuemax={questions.length}><span style={{ width: `${((position + 1) / questions.length) * 100}%` }} /></div><fieldset className="quiz-question"><legend>{question.statement}</legend>{question.options.map(option => <label key={option.id} className="quiz-option"><input type="radio" name={`question-${question.id}`} checked={answers[question.id] === option.id} onChange={() => setAnswers(previous => ({ ...previous, [question.id]: option.id }))} />{option.text}</label>)}</fieldset>{attempt.isError && <p className="form-error" role="alert">{errorMessage(attempt.error)}</p>}<div className="quiz-actions"><button className="button button-outline" disabled={position === 0} onClick={() => setPosition(position - 1)}>Anterior</button>{position + 1 < questions.length ? <button className="button" disabled={!answers[question.id]} onClick={() => setPosition(position + 1)}>Seguinte</button> : <button className="button" disabled={Object.keys(answers).length !== questions.length || attempt.isPending} onClick={() => attempt.mutate()}>{attempt.isPending ? 'A enviar…' : 'Ver resultado'}</button>}</div></div>
}

export function QuizHistoryPage() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['quizzes', 'history'], queryFn: async ({ signal }) => (await http.get<Page<Attempt>>('/me/attempts', { signal })).data.data })
  return <div className="dashboard"><p className="eyebrow">As minhas tentativas</p><h1>Histórico de quizzes</h1><p>Cada resultado pertence apenas à respectiva tentativa.</p>{isPending ? <div className="skeleton skeleton-row" role="status">A carregar…</div> : isError ? <div className="state-panel"><p>Não foi possível carregar o histórico.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : data.length === 0 ? <div className="state-panel"><p>Ainda não resolveu nenhum quiz.</p><Link to="/app/quizzes" className="button">Ver quizzes</Link></div> : <div className="stack-list">{data.map(item => <article key={item.id} className="list-card"><div><h2>{item.quiz?.title || 'Quiz'}</h2><p>{item.completed_at ? new Intl.DateTimeFormat('pt', { dateStyle: 'medium' }).format(new Date(item.completed_at)) : 'Data indisponível'}</p></div><span className="pill">{item.correct_count} / {item.total_questions}</span></article>)}</div>}</div>
}
