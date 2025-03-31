import NIOSSL
import Fluent
import FluentMongoDriver
import Leaf
import Vapor

// configures your application
public func configure(_ app: Application) async throws {
    // uncomment to serve files from /Public folder
	app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))

	app.routes.defaultMaxBodySize = "10mb"
	
    try app.databases.use(DatabaseConfigurationFactory.mongo(
        connectionString: Environment.get("DATABASE_URL") ?? "mongodb://localhost:27017/vapor_database"
    ), as: .mongo)

    app.migrations.add(CreateTodo())
    app.migrations.add(CreateCustomer())
    app.migrations.add(CreateAddress())
    app.migrations.add(CreateManager())
    app.migrations.add(CreateRole())

//    app.migrations.add(CreateTodo())
    app.migrations.add(CreateSize())
    app.migrations.add(CreateBrand())
    app.migrations.add(CreateCategory())
    app.migrations.add(CreateProduct())
    app.migrations.add(CreateProductDetail())
	
	app.migrations.add(CreateCart())
	app.migrations.add(CreateFavorite())
	
	app.migrations.add(CreateInvoice())
	app.migrations.add(CreateInvoiceItem())
	
    app.views.use(.leaf)


    // register routes
    try routes(app)
}
