void(() => {
  const fieldElement = document.getElementById("field")
  const scoreElement = document.getElementById("score")

  setInterval(async () => {
    const [fieldHtml, scoreHtml] = await Promise.all([
      fetch("getFieldHtml").then(res => res.text()),
      fetch("getScoresHtml").then(res => res.text())
    ])

    fieldElement.innerHTML = fieldHtml
    scoreElement.innerHTML = scoreHtml
  }, 1000)
})()
