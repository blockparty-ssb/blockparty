'use strict'
const h = require('hyperscript')
const { div, ul, li, a, img } =
  require('hyperscript-helpers')(h)


module.exports = function (appIds) {
  return div('.blockparties',
    ul('.list-blockparties',
      li('.blockparty',
        a('#blockparty1-link',
          {href: '#'},
          div('.blockparty-icon',
            img('.blockparty-img',
              {src: `https://ui-avatars.com/api/?name=${appIds[0]}&background=f9f7bb&color=fff`}
            )
          )
        )
      ),
      li('.blockparty',
        a('#blockparty2-link',
          {href: '#'},
          div('.blockparty-icon',
            img('.blockparty-img',
              {src: `https://ui-avatars.com/api/?name=${appIds[1]}&background=c7ddfc&color=fff`}
            )
          )
        )
      )
    ),
    div('#add-network', '+', {onclick: () => {
      console.log('new network')
    }}),
  )
}
