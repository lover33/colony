import { Cookies } from 'quasar'
import { i18n, builder } from '@utopian/i18n'

/* Get and set the locale
 *
 * @property {object} ssrContext - required for isomorphism
 *
 *
 *
 * @returns {string} Language from cookie, browser header or default
 */
export const getDefaultLocale = ssrContext => {
  const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies
  if (cookies.get('lang')) {
    // guard to make sure the cookie IS really available

    return cookies.get('lang')
  } else if (ssrContext) {
    const languages = ssrContext.req.headers['accept-language']
    if (languages) {
      let match
      for (let langQ of languages.split(',')) {
        match = Object.keys(messages).find(lang => langQ.split(';')[0].startsWith(lang))
        if (match) {
          cookies.set('lang', match)
          break
        }
      }
      if (match) {
        return match
      }
    }
  }
  return 'en-us'
}

export default ({app, Vue, ssrContext}) => {
  const locale = getDefaultLocale(ssrContext)

  Vue.mixin({
    /**
     * Vue global object available everywhere
     * @namespace
     * @property {array}   props             - The :lang token from the route
     * @property {string}  lang              - The active language
     */
    data () {
      return {
        props: ['lang'],
        lang: this.$q.i18n.lang
      }
    },
    mounted () {
      // watch for the emit event
      this.$root.$on('lang', () => {
        this.langChange(lang)
      })
      this.$q.i18n.set = locale
    },
    methods: {

      langChange: (val) => {
        import(`quasar-framework/i18n/${val}`)
        .then(() => {
          this.$q.i18n.set(val.default)
        })
        // get the app i18n
        import(`../src/i18n/locales/${val}`)
        .then(() => {
          // this will probably not work although i wish it would
          // this.$router.push({ params: { lang: val } })
          // instead we'll need to get the hash, strip out the lang string and replace it
          let route = this.$router.hash.split('/')
          route[1]=val
          this.$router.push({ path: `${route.join('/')}` })
          // try to merge into the $q.i18n object?
        })
      }
    },
    watch: {
      lang: {
        handler(val, oldVal) {
          // get the quasar i18n
          import(`quasar-framework/i18n/${val}`)
          .then(() => {
            this.$q.i18n.set(val.default)
          })
          // get the app i18n
          import(`../src/i18n/locales/${val}`)
          .then(() => {
            // this will probably not work although i wish it would
            // this.$router.push({ params: { lang: val } })
            // instead we'll need to get the hash, strip out the lang string and replace it
            let route = this.$router.hash.split('/')
            route[1]=val
            this.$router.push({ path: `${route.join('/')}` })
          })
        },
        immediate: true
      }
    }
  })
}
