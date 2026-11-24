// Casos de estudio: /projects/{key}. Cada uno necesita su ruta en App.jsx,
// su rewrite en vercel.json, su entrada en el sitemap y caseStudy en projects.js.
//
// testimonial: { quote, author } o null. Solo se muestra si existe: no se
// inventa una cita, se pide al cliente.
const caseStudies = {
  en: {
    ui: {
      label: "case study",
      back: "← All projects",
      facts: "Project facts",
      shotAlt: (title) => `${title} home page`,
      live: "↗ Visit the live site",
      github: "↗ Read the code",
    },
    dankar: {
      intro:
        "An online catalog for a handmade hair-accessories shop in Pariaguán, Venezuela. Customers build an order and send it to WhatsApp in one message; the owner runs the catalog herself from a private admin panel.",
      facts: [
        ["Client", "Detalles DanKar · Pariaguán, Venezuela"],
        ["Role", "Solo full-stack developer"],
        ["Status", "In production"],
        ["Hosting", "Vercel (store) · Render (API)"],
      ],
      sections: [
        {
          title: "The brief",
          paragraphs: [
            "Detalles DanKar sells bows, headbands, bracelets and more, many of them personalized. The shop needed a catalog where customers could choose products, colors and sizes and order without friction, and a way for the owner to keep products, photos and prices up to date on her own.",
            "Prices add a local constraint: they have to be shown in dollars and bolívares, and the exchange rate changes every day.",
          ],
        },
        {
          title: "Key decisions",
          items: [
            {
              title: "Orders go to WhatsApp, not to a checkout",
              body: "The cart puts the whole order together (products, options, notes and totals in both currencies) and sends it as a single WhatsApp message. There is no payment gateway to integrate or maintain, and the sale is closed in a conversation with the owner.",
            },
            {
              title: "One exchange rate, set daily by the owner",
              body: "Products are priced in dollars. The owner sets the day's rate once, and the store, the cart and the WhatsApp message show both currencies. No product has to be edited when the rate moves.",
            },
            {
              title: "AI writes product descriptions from the photo",
              body: "Writing copy is the slowest part of adding a product. One click in the admin panel sends the main photo and the product data to a vision model (Qwen 3.8 27B on Groq), which writes two or three sentences in a warm Venezuelan Spanish tone. The prompt only allows facts from the data and the photo, keeps the owner's notes word for word and leaves prices out. The owner reviews the text, asks for another version or undoes it.",
            },
            {
              title: "Security sized for a small shop",
              body: "The browser only talks to one origin: Vercel forwards /api to the Render API, so the session cookie (a JWT in an httpOnly cookie) stays first-party. Logins, uploads and AI requests are rate-limited per IP, uploaded images are checked by their real content and every write is validated with Zod.",
            },
          ],
        },
        {
          title: "Trade-offs and lessons",
          items: [
            {
              title: "Free hosting means a cold start",
              body: "Render's free plan puts the API to sleep after 15 idle minutes, and waking it takes about a minute. I tried a keep-alive pinger and removed it. Instead, the store says it is waking the server and offers a retry button.",
            },
            {
              title: "The catalog survives a database outage",
              body: "The catalog is served from memory, so the store keeps working if MongoDB stops responding. The health check only fails if the catalog was never loaded.",
            },
            {
              title: "One photo per AI request",
              body: "To limit input usage, I send one 768 px main photo per request. Groq counts each image as 2,048 input tokens for this model, regardless of pixel dimensions; in my tests, smaller images used the same number of input tokens and were recognized less accurately.",
            },
          ],
        },
      ],
      testimonial: null,
    },
  },
  es: {
    ui: {
      label: "caso de estudio",
      back: "← Todos los proyectos",
      facts: "Datos del proyecto",
      shotAlt: (title) => `Página de inicio de ${title}`,
      live: "↗ Ver la tienda en vivo",
      github: "↗ Ver el código",
    },
    dankar: {
      intro:
        "Catálogo en línea para una tienda de accesorios artesanales para el cabello en Pariaguán, Venezuela. Los clientes arman su pedido y lo envían a WhatsApp en un solo mensaje; la dueña gestiona el catálogo por su cuenta desde un panel privado.",
      facts: [
        ["Cliente", "Detalles DanKar · Pariaguán, Venezuela"],
        ["Rol", "Desarrollador full-stack, en solitario"],
        ["Estado", "En producción"],
        ["Alojamiento", "Vercel (tienda) · Render (API)"],
      ],
      sections: [
        {
          title: "El encargo",
          paragraphs: [
            "Detalles DanKar vende lazos, cintillos, pulseras y más, muchos de ellos personalizados. La tienda necesitaba un catálogo donde los clientes eligieran productos, colores y tamaños y pidieran sin complicaciones, y una forma de que la dueña mantuviera productos, fotos y precios al día por su cuenta.",
            "Los precios suman una condición local: hay que mostrarlos en dólares y en bolívares, y el tipo de cambio cambia cada día.",
          ],
        },
        {
          title: "Decisiones clave",
          items: [
            {
              title: "El pedido va a WhatsApp, no a una pasarela de pago",
              body: "El carrito arma el pedido completo (productos, opciones, notas y totales en las dos monedas) y lo envía en un solo mensaje de WhatsApp. No hay pasarela de pago que integrar ni mantener, y la venta se cierra en una conversación con la dueña.",
            },
            {
              title: "Un tipo de cambio, fijado cada día por la dueña",
              body: "Los productos tienen precio en dólares. La dueña fija la tasa del día una sola vez, y la tienda, el carrito y el mensaje de WhatsApp muestran las dos monedas. Cuando la tasa cambia, no hay que editar ningún producto.",
            },
            {
              title: "La IA escribe la descripción a partir de la foto",
              body: "Redactar es lo que más tarda al cargar un producto. Con un clic en el panel, la foto principal y los datos del producto van a un modelo de visión (Qwen 3.8 27B en Groq), que escribe dos o tres frases en un tono venezolano cercano. El prompt solo admite datos del producto y de la foto, conserva tal cual las notas de la dueña y deja fuera los precios. La dueña revisa el texto, pide otra versión o lo deshace.",
            },
            {
              title: "Seguridad a la medida de una tienda pequeña",
              body: "El navegador habla con un solo origen: Vercel reenvía /api a la API en Render, así que la cookie de sesión (un JWT en una cookie httpOnly) es de primera parte. Los inicios de sesión, las subidas y las peticiones a la IA tienen límite por IP, las imágenes se validan por su contenido real y cada escritura pasa por Zod.",
            },
          ],
        },
        {
          title: "Compromisos y aprendizajes",
          items: [
            {
              title: "Alojamiento gratuito, arranque en frío",
              body: "El plan gratuito de Render duerme la API tras 15 minutos sin uso, y despertarla tarda cerca de un minuto. Probé un pinger para mantenerla despierta y lo quité. En su lugar, la tienda avisa que está despertando el servidor y ofrece un botón para reintentar.",
            },
            {
              title: "El catálogo sobrevive a una caída de la base de datos",
              body: "El catálogo se sirve desde memoria, así que la tienda sigue funcionando si MongoDB deja de responder. El health check solo falla si el catálogo nunca llegó a cargarse.",
            },
            {
              title: "Una foto por petición a la IA",
              body: "Para limitar el consumo de entrada, envío una foto principal de 768 px por petición. Groq cuenta cada imagen como 2.048 tokens de entrada para este modelo, sin importar sus dimensiones; en mis pruebas, las imágenes más pequeñas consumieron la misma cantidad de tokens de entrada y se reconocieron con menos precisión.",
            },
          ],
        },
      ],
      testimonial: null,
    },
  },
};

export default caseStudies;
