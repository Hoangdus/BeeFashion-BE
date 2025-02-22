import Fluent
import Vapor

func routes(_ app: Application) throws {
    app.get { req async throws in
        try await req.view.render("index", ["title": "Hello Vapor!"])
    }

    app.get("hello") { req async -> String in
        "Hello, world!"
    }

    try app.register(collection: SizeController())
    try app.register(collection: BrandController())
    try app.register(collection: CategoryController())
    try app.register(collection: ProductController())
    try app.register(collection: ProductDetailController())
}
