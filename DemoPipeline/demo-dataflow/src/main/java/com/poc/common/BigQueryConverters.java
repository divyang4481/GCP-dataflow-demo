package com.poc.common;

import com.google.api.services.bigquery.model.TableRow;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.apache.beam.sdk.coders.Coder.Context;
import org.apache.beam.sdk.io.gcp.bigquery.TableRowJsonCoder;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.SimpleFunction;
import org.apache.beam.sdk.values.PCollection;



public class BigQueryConverters {

    /** Factory method for {@link JsonToTableRow}. */
    public static PTransform<PCollection<String>, PCollection<TableRow>> jsonToTableRow() {
        return new JsonToTableRow();
    }

    /** Converts UTF8 encoded Json records to TableRow records. */
    private static class JsonToTableRow extends PTransform<PCollection<String>, PCollection<TableRow>> {

        @Override
        public PCollection<TableRow> expand(PCollection<String> stringPCollection) {
            return stringPCollection.apply("JsonToTableRow",
                    MapElements.<String, TableRow>via(new SimpleFunction<String, TableRow>() {
                        @Override
                        public TableRow apply(String json) {
                            System.out.print("divyng");

                            System.out.print(json);
                            System.out.print("divyng");
                            try {

                                InputStream inputStream = new ByteArrayInputStream(
                                        json.getBytes(StandardCharsets.UTF_8.name()));

                                //OUTER is used here to prevent EOF exception
                                return TableRowJsonCoder.of().decode(inputStream, Context.OUTER);
                            } catch (IOException e) {
                                throw new RuntimeException("Unable to parse input", e);
                            }
                        }
                    }));
        }
    }
}