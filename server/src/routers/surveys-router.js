// crud para el front

// pedro

// TODO: filter questions by kind
// TODO: add constraint where only one survey can be active at a given time
// TODO: add transactions ?
// TODO: consistent id naming

import express from "express";
import { pool } from "../db/connection.js";
import { z } from "zod";
import { ANSWER_KIND, SECTION_KIND } from "../utils/constants.js";

const surveysRouter = express.Router();

surveysRouter.get("/surveys/published", async (req, res) => {
  try {
    const [surveys] = await pool.query(
      "SELECT id FROM Survey WHERE isPublished = TRUE"
    );

    const [survey] = z
      .object({ id: z.number() })
      .array()
      .length(1)
      .parse(surveys);

    res.status(200).send({ survey });
  } catch (error) {
    res.status(400).send({ error: error.message || "Unknown error" });
  }
});

surveysRouter.post("/surveys/published", async (req, res) => {
  try {
    const { id: surveyId } = z.object({ id: z.number() }).parse(req.body);

    const [surveys] = await pool.query("SELECT id FROM Survey WHERE id = ?", [
      surveyId,
    ]);

    z.object({ id: z.number() }).array().length(1).parse(surveys);

    await pool.query("UPDATE Survey SET isPublished = FALSE");
    await pool.query("UPDATE Survey SET isPublished = TRUE WHERE id = ?", [
      surveyId,
    ]);

    res.sendStatus(200);
  } catch (error) {
    res.status(400).send({ error: error.message || "Unknown error" });
  }
});

surveysRouter.get("/surveys", async (req, res) => {
  try {
    const [surveys] = await pool.query("SELECT * FROM Survey");

    res.status(200).send(surveys);
  } catch (error) {
    res.status(400).send({ error: error.message || "Unknown error" });
  }
});

surveysRouter.post("/surveys", async (req, res) => {
  try {
    const { title, questionIds } = z
      .object({
        title: z.string(),
        questionIds: z.number().array().nonempty(),
      })
      .parse(req.body);

    await pool.query("INSERT INTO Survey VALUES (NULL, ?, FALSE)", [title]);

    const [surveys] = await pool.query(
      "SELECT id FROM Survey WHERE title = ?",
      [title]
    );

    const [survey] = z
      .object({ id: z.number() })
      .array()
      .length(1)
      .parse(surveys);

    for (const questionId of questionIds) {
      await pool.query("INSERT INTO SurveyQuestion VALUES (?, ?)", [
        survey.id,
        questionId,
      ]);
    }

    res.sendStatus(200);
  } catch (error) {
    res.status(400).send({ error: error.message || "Unknown error" });
  }
});

surveysRouter.put("/surveys/:surveyId", async (req, res) => {
  try {
    const { surveyId } = z
      .object({ surveyId: z.string().transform((s) => parseInt(s)) })
      .parse(req.params);

    const [surveys] = await pool.query("SELECT id FROM Survey WHERE id = ?", [
      surveyId,
    ]);

    z.object({ id: z.number() }).array().length(1).parse(surveys);

    await pool.query("DELETE FROM SurveyQuestion WHERE surveyId = ?", [
      surveyId,
    ]);

    const { title, questionIds } = z
      .object({
        title: z.string(),
        questionIds: z.number().array().nonempty(),
      })
      .parse(req.body);

    await pool.query("UPDATE Survey SET title = ? WHERE id = ?", [
      title,
      surveyId,
    ]);

    for (const questionId of questionIds) {
      await pool.query("INSERT INTO SurveyQuestion VALUES (?, ?)", [
        surveyId,
        questionId,
      ]);
    }

    res.sendStatus(200);
  } catch (error) {
    res.status(400).send({ error: error.message || "Unknown error" });
  }
});

surveysRouter.get("/surveys/:surveyId", async (req, res) => {
  try {
    const { surveyId } = z
      .object({ surveyId: z.string().transform((s) => parseInt(s)) })
      .parse(req.params);

    const [surveys] = await pool.query(
      "SELECT id, title FROM Survey WHERE id = ?",
      [surveyId]
    );

    const [survey] = z
      .object({ id: z.number(), title: z.string() })
      .array()
      .length(1)
      .parse(surveys);

    let [rawQuestions] = await pool.query(
      "SELECT Question.*, IF(surveyId IS NULL, FALSE, TRUE) AS isActive FROM Question LEFT JOIN SurveyQuestion ON Question.id = SurveyQuestion.questionId AND surveyId = ? ORDER BY Question.title ASC",
      [surveyId]
    );

    let questions = z
      .object({
        id: z.number(),
        title: z.string(),
        section: z.enum(SECTION_KIND),
        answerKind: z.enum(ANSWER_KIND),
        isActive: z.number().transform((n) => Boolean(n)),
      })
      .array()
      .parse(rawQuestions);

    const { section, isActive } = z
      .object({
        section: z.enum(SECTION_KIND).optional(),
        isActive: z
          .string()
          .transform((s) => {
            if (s.toLowerCase() === "true") {
              return true;
            }

            if (s.toLowerCase() === "false") {
              return false;
            }

            throw new Error(`invalid string: ${s} on isActive`);
          })
          .optional(),
      })
      .parse(req.query);

    if (section !== undefined) {
      questions = questions.filter((question) => question.section === section);
    }

    if (isActive !== undefined) {
      questions = questions.filter(
        (question) => question.isActive === isActive
      );
    }

    res.status(200).send({ ...survey, questions });
  } catch (error) {
    res.status(400).send({ error: error.message || "Unknown error" });
  }
});

surveysRouter.delete("/surveys/:surveyId", async (req, res) => {
  try {
    const { surveyId } = z
      .object({ surveyId: z.string().transform((s) => parseInt(s)) })
      .parse(req.params);

    await pool.query("DELETE FROM Survey WHERE id = ?", [surveyId]);

    res.sendStatus(200);
  } catch (error) {
    res.status(400).send({ error: error.message || "Unknown error" });
  }
});

export default surveysRouter;
