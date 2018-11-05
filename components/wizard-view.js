'use strict'
const h = require('hyperscript')
const { div, button } =
  require('hyperscript-helpers')(h)
const textField = require('./input-field')
const labels = require('./labels').wizard

module.exports = function (state, emit) {
  const activePage = state.wizard.activePage || 'enterName'
  const wizardPages = {
    enterName: div(labels.enterAppId,
      textField({id: '', name: ''}),
      button(labels.continue, {
        onclick: () => {
          state.wizard.activePage = 'hasAccount'
          emit('render')
        }
      })
    ),
    hasAccount: div(labels.haveAccount,
      button(labels.accountYes),
      button(labels.accountNo)
    )
  }

  const currentWizardPage = wizardPages[activePage]
  return div('#wizard-view', currentWizardPage)
}
