import React, { useState } from "react";

// FAQ Component
const FaqContent = () => {
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const toggleQuestion = (index) => {
    setSelectedQuestion(selectedQuestion === index ? null : index);
  };

  const faqData = [
    {
      question: "How do I run an SQL query on the platform?",
      answer: "You can easily run SQL queries by accessing the query console. Simply input your SQL command and execute to retrieve results.",
    },
    {
      question: "Why can't I Sequelize the data?",
      answer: "Try doing Fix Headers and cleanup the data. The SQL error messages sometimes doesn't correspond to the actual error.",
    },
    {
      question: "Where can I check the SQL Queries",
      answer: "You can check comprehensive logs in Web Console",
    },
    {
      question: "Can I save my work?",
      answer: "For now no, the application uses sqlite wasm, in order to save it, we would have to implement file storage in paid features."
    },
    {
      question: "Can I export SQL query results to CSV?",
      answer: "Yes, once the SQL query is executed, you can export the results by clicking on the 'Export' icon on top of Results table.",
    },
    {
      question: "Is there a limit on the number of queries I can run?",
      answer: "There is no limit on the number of queries. However, execution time may depend on the complexity of the query.",
    },
    {
      question: "What formats are available for export?",
      answer: "You can export SQL query results in CSV, Excel, and JSON formats for further analysis.",
    },
    {
      question: "How do I troubleshoot SQL errors?",
      answer: "Check the syntax of your SQL command or report to us. We are working on common errors.",
    },
  ];

  const getAnswerClassName = (index) => {
    let classNames = ['answer']
    if (selectedQuestion !== index) {
      classNames.push('hide')
    }

    return classNames.join(' ')
  }

  return (
    <div className="faq">
      <h2>Frequently Asked Questions</h2>
      <ul>
        {faqData.map((faq, index) => (
          <li key={index} id={`faq-${index + 1}`} className="question-wrapper">
            <div
              className="question"
              onClick={() => toggleQuestion(index)}
              style={{ cursor: "pointer" }}
            >
              <a
                href={`#faq-${index + 1}`}
                className="faq-link">
                #
              </a>
              {faq.question}
            </div>
            {<p className={getAnswerClassName(index)}>{faq.answer}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FaqContent;

