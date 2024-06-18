package adam.cli;

import adam.cli.N1710.Grupos;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Adam
 */
public class Diretorio {

    private File diretorioAtual;
    private File diretorioDestino;
    public static boolean mostraSaida = true;
    public static int numeroArquivos = 0;

    public Diretorio() {
    }

    public Diretorio(String argumento) {

        this.diretorioAtual = new File(argumento);
        this.loopNaPasta();
    }

    public Diretorio(String[] argumentos) {

        this.diretorioAtual = new File(argumentos[0]);

        if (argumentos.length == 2) {
            mostraSaida = Boolean.parseBoolean(argumentos[1]);
            if (mostraSaida) {
                System.out.println("Saída ativada.");
            } else {
                System.out.println("Saída desativada.");
            }
        } else {
            if (argumentos.length == 3) {
                if (argumentos[2] != null) {
                    mostraSaida = Boolean.parseBoolean(argumentos[2]);
                    if (mostraSaida) {
                        System.out.println("Saída ativada.");
                    } else {
                        System.out.println("Saída desativada.");
                    }
                }
                if (argumentos[1] != null) {
                    diretorioDestino = new File(argumentos[1]);
                    System.out.println("Lendo de: " + argumentos[0]);
                    System.out.println("Escrevendo em: " + argumentos[1]);
                }
            }
        }

        this.loopNaPasta();
    }

    private void loopNaPasta() {

        int numeroPastas = 0;

        for (File f : diretorioAtual.listFiles()) {

            if (!f.isDirectory()) {
                numeroPastas++;
                numeroArquivos++;
            }
        }

        int contaArquivos = 0;

        for (File f : diretorioAtual.listFiles()) {

            if (f.isDirectory()) {
                numeroPastas++;

                if (mostraSaida) {
                    System.out.println("\n============================================================================================\n"
                            + "Pasta processada: " + f.getName());
                }
                this.separarEmGrupos(f, diretorioDestino);

            } else {
                contaArquivos++;
                System.out.print(100 * contaArquivos / numeroArquivos + "%\r");

                if (mostraSaida) {

                    System.out.println("\n============================================================================================\n"
                            + "Arquivo processado: " + f.getName());
                }
                this.separarEmGrupos(f, diretorioDestino);
            }
        }
        this.gerarSaidaCSV();

    }

    private void separarEmGrupos(File arquivoOrigem, File diretorioDestino) {

        new Grupos(arquivoOrigem, diretorioDestino);
        if (mostraSaida) {
            System.out.println("Dados no log de saída: " + Grupos.listaSaidaCSV.size());
        }

    }

    private void gerarSaidaCSV() {

        //Prepara arquivo de saída, para eventual escrita dos padrões encontrados
        FileWriter fw;
        BufferedWriter bw;

        try {

            String pastaExecutavel = new File(this.getClass().getProtectionDomain().getCodeSource().getLocation().toURI()).getParent();
            Path nomeArquivo = Paths.get(pastaExecutavel + "\\Lista.csv");
            File arquivoSaida = new File(pastaExecutavel + "\\Lista.csv");

            //Se, dado o caminho é constatado que já existe o arquivo:
            if (Files.exists(nomeArquivo)) {
                System.out.println("O arquivo já existe. Conferindo se já existe conteúdo...");
                FileReader fr = new FileReader(arquivoSaida);
                BufferedReader br = new BufferedReader(fr);

                //Testa se há cabeçalho. Se não houver, cria-se um.
                if (br.readLine() == null) {

                    br.close();
                    fr.close();

                    System.out.println("Não existe cabeçalho. Escrevendo primeira linha...");
                    //O parâmetro true faz append no arquivo
                    fw = new FileWriter(arquivoSaida, true);
                    bw = new BufferedWriter(fw);

                    bw.write("Nome_Original;G0_Linguagem;G1_Categoria;G2_Projeto;G3_Sistema;G4_Classe;G5_Vendor;G6;G7_Versao;Data;Link\r\n");
                    bw.close();
                    fw.close();
                    gerarSaidaCSV();

                } else {
                    System.out.println("O arquivo existe com conteúdo. Adicionando...");
                    fw = new FileWriter(arquivoSaida, true);
                    bw = new BufferedWriter(fw);

                    for (String s : Grupos.listaSaidaCSV) {
                        bw.write(s);
                    }

                    bw.close();
                    fw.close();
                }

                //Não existe o arquivo. Cria-se um    
            } else {
                System.out.println("O arquivo não existe. Criando...");
                arquivoSaida = new File(pastaExecutavel + "\\Lista.csv");

                fw = new FileWriter(arquivoSaida, true);
                bw = new BufferedWriter(fw);

                bw.close();
                fw.close();

                //Após gerado o arquivo, retorna ao início do método.
                gerarSaidaCSV();

            }

        } catch (IOException e) {
            System.out.println("Erro " + e);
        } catch (URISyntaxException ex) {
            Logger.getLogger(Diretorio.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

}
