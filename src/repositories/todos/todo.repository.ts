import { prisma } from '@infrastructure/persistence/prisma';
import type { Prisma } from '@prisma/client';

export function findTodosAll(orderBy: Prisma.TodoOrderByWithRelationInput) {
  return prisma.todo.findMany({ orderBy });
}

export function createTodo(input: Prisma.TodoCreateInput) {
  return prisma.todo.create({ data: input });
}

export function deleteTodoById(id: string) {
  return prisma.todo.delete({ where: { id } });
}

export function deleteAllTodos() {
  return prisma.todo.deleteMany({});
}
