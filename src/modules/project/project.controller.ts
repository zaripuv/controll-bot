import { Request, Response } from "express";
import prisma from "../../config/database";
import {
  createProjectService,
  getProjects,
  getProjectStats,
} from "./project.service";

export const createProject = async (req: Request, res: Response) => {
  const { name, link, reward, voteOperatorId, paymentOperatorId } = req.body;

  const project = await createProjectService(
    name,
    link,
    reward,
    voteOperatorId,
    paymentOperatorId,
  );

  res.json(project);
};

export const listProjects = async (_req: Request, res: Response) => {
  const projects = await getProjects();
  res.json(projects);
};

export const projectStats = async (req: Request, res: Response) => {
  const projectId = Number(req.params.id);
  const stats = await getProjectStats(projectId);
  res.json(stats);
};

export const updateProject = async (req: Request, res: Response) => {

  const projectId = Number(req.params.id);

  const { reward, voteOperatorId, paymentOperatorId } = req.body;

const project = await prisma.project.update({
  where: { id: projectId },
  data: {
    ...(reward !== undefined && { reward }),
    ...(voteOperatorId !== undefined && { voteOperatorId }),
    ...(paymentOperatorId !== undefined && { paymentOperatorId }),
  }
});

  res.json(project);

};
