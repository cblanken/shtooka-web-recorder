// https://on.cypress.io/api

describe('Load homepage', () => {
  it('visits the app root url', () => {
    cy.visit('/')
    cy.contains('h1', 'Tato Web Recorder')
  })
})
