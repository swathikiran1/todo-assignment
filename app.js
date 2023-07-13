const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const isMatch = require("date-fns/isMatch");
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const categoryArray = ["WORK", "HOME", "LEARNING"];
const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const priorityArray = ["HIGH", "MEDIUM", "LOW"];

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const isValidPriorityProperty = (requestQuery) => {
  return priorityArray.includes(requestQuery.priority);
};

const isValidStatusProperty = (requestQuery) => {
  return statusArray.includes(requestQuery.status);
};

const isValidCategoryProperty = (requestQuery) => {
  return categoryArray.includes(requestQuery.category);
};
const convertRequestObjectToResponseObject = (requestObj) => {
  return {
    id: requestObj["id"],
    todo: requestObj["todo"],
    priority: requestObj["priority"],
    status: requestObj["status"],
    category: requestObj["category"],
    dueDate: requestObj["due_date"],
  };
};

// Get Todos API

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  let getTodoQuery = "";
  let data = null;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
               SELECT
                  *
               FROM
                  todo
               WHERE
                  status = '${status}'
                  AND priority = '${priority}';`;
      if (
        isValidPriorityProperty(request.query) &&
        isValidStatusProperty(request.query)
      ) {
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertRequestObjectToResponseObject(eachItem))
        );
      } else {
        if (isValidPriorityProperty(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Priority");
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      }

      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = `
               SELECT
                  *
               FROM
                  todo
               WHERE
                  category = '${category}'
                  AND status = '${status}';`;
      if (
        isValidCategoryProperty(request.query) &&
        isValidStatusProperty(request.query)
      ) {
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertRequestObjectToResponseObject(eachItem))
        );
      } else {
        if (isValidCategoryProperty(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Category");
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      }

      break;

    case hasCategoryAndPriorityProperties(request.query):
      if (
        isValidCategoryProperty(request.query) &&
        isValidPriorityProperty(request.query)
      ) {
        getTodoQuery = `
               SELECT
                  *
               FROM
                  todo
               WHERE
                  category = '${category}'
                  AND priority = '${priority}';`;

        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertRequestObjectToResponseObject(eachItem))
        );
      } else {
        if (isValidCategoryProperty(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Category");
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }

      break;

    case hasPriorityProperty(request.query):
      getTodoQuery = `
               SELECT
                  *
               FROM
                  todo
               WHERE
                  priority = '${priority}';`;
      if (isValidPriorityProperty(request.query)) {
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertRequestObjectToResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case hasStatusProperty(request.query):
      getTodoQuery = `
               SELECT
                  *
               FROM
                  todo
               WHERE
                  status = '${status}';`;

      if (isValidStatusProperty(request.query)) {
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertRequestObjectToResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case hasCategoryProperty(request.query):
      if (isValidCategoryProperty(request.query)) {
        getTodoQuery = `
               SELECT
                  *
               FROM
                  todo
               WHERE
                  category = '${category}';`;
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertRequestObjectToResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    default:
      getTodoQuery = `
               SELECT
                 *
               FROM
                  todo
               WHERE
                  todo LIKE '%${search_q}%';`;

      data = await db.all(getTodoQuery);
      response.send(
        data.map((eachItem) => convertRequestObjectToResponseObject(eachItem))
      );

      break;
  }
});

// Get One Todo API

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
       SELECT
          *
       FROM
          todo
       WHERE
          id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertRequestObjectToResponseObject(todo));
});

// Get Todo With Agenda API

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `
        SELECT
           *
        FROM
           todo
        WHERE
           due_date = '${newDate}';`;

    const responseResult = await db.all(getTodoQuery);
    response.send(
      responseResult.map((eachItem) =>
        convertRequestObjectToResponseObject(eachItem)
      )
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// Post Todo API

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (isValidPriorityProperty(request.body)) {
    if (isValidStatusProperty(request.body)) {
      if (isValidCategoryProperty(request.body)) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createTodoQuery = `
                INSERT INTO todo(id, todo, priority, status, category, due_date)
                VALUES(${id},
                    '${todo}',
                    '${priority}',
                    '${status}',
                    '${category}',
                    '${postNewDueDate}');`;
          await db.run(createTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

// Update Todo API

const isTodoProperty = (requestObj) => {
  return requestObj.todo !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { id, todo, priority, status, category, dueDate } = request.body;
  let updateQuery = "";
  let responseMsg = null;
  switch (true) {
    case hasStatusProperty(request.body):
      updateQuery = `
             UPDATE todo
             SET status = '${status}'
             WHERE
              id = ${todoId};`;

      responseMsg = "Status Updated";
      if (isValidStatusProperty(request.body)) {
        await db.run(updateQuery);
        response.send(responseMsg);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.body):
      updateQuery = `
             UPDATE todo
             SET priority = '${priority}'
             WHERE
              id = ${todoId};`;
      responseMsg = "Priority Updated";
      if (isValidPriorityProperty(request.body)) {
        await db.run(updateQuery);
        response.send(responseMsg);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case isTodoProperty(request.body):
      updateQuery = `
             UPDATE todo
             SET todo = '${todo}'
             WHERE
              id = ${todoId};`;
      responseMsg = "Todo Updated";
      await db.run(updateQuery);
      response.send(responseMsg);
      break;
    case hasCategoryProperty(request.body):
      updateQuery = `
             UPDATE todo
             SET category = '${category}'
             WHERE
              id = ${todoId};`;
      responseMsg = "Category Updated";
      if (isValidCategoryProperty(request.body)) {
        await db.run(updateQuery);
        response.send(responseMsg);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateQuery = `
             UPDATE todo
             SET due_date = '${newDueDate}'
             WHERE
              id = ${todoId};`;
        responseMsg = "Due Date Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

// Delete Todo API

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
