"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    let statusCode = 500;
    let errorMessage = "Internal Server Error";
    if (err instanceof SyntaxError) {
        statusCode = 400;
        errorMessage = "Bad Request: Invalid JSON";
    }
    else if (err instanceof Error) {
        if (err.message.includes("Not Found")) {
            statusCode = 404;
            errorMessage = "Not Found: The requested resource could not be found";
        }
        else if (err.message.includes("Unauthorized")) {
            statusCode = 401;
            errorMessage =
                "Unauthorized: You do not have permission to access this resource";
        }
    }
    res.send.status(statusCode).send.Body(`
      <style>
      body {
        background-color: #333;
        width: 100vw;
        height: 100vh;
        color: #fff;
        font-family: 'Arial Black';
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .error-num {
        font-size: 8em;
      }
      .eye {
        background: #fff;
        border-radius: 50%;
        display: inline-block;
        height: 100px;
        position: relative;
        width: 100px;
      }
      .eye::after {
        background: #000;
        border-radius: 50%;
        bottom: 56.1px;
        content: '';
        height: 33px;
        position: absolute;
        right: 33px;
        width: 33px;
      }
      p {
        margin-bottom: 4em;
      }
      a {
        color: #fff;
        text-decoration: none;
        text-transform: uppercase;
      }
      a:hover {
        color: #d3d3d3;
      }
      </style>
      <div>
        <span class='error-num'>${statusCode}</span>
        <div class='eye'></div>
        <div class='eye'></div>
        <p class='sub-text'>${errorMessage}</p>
        <a href='/'>Go back</a>
      </div>`);
}
